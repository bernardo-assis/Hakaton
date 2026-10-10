"""SQLite contract tests; run: python3 -m unittest discover -s backend/tests -v."""
from pathlib import Path
import sqlite3
import unittest

SCHEMA = Path(__file__).resolve().parents[1] / 'src/db/schema.sql'
MAX = 9007199254740991


class SchemaTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(SCHEMA.exists(), 'Missing initial payment schema')
        self.db = sqlite3.connect(':memory:')
        self.addCleanup(self.db.close)
        self.db.executescript(SCHEMA.read_text())
        self.db.execute("INSERT INTO vaults(id,owner_pubkey,vault_pubkey,key_reference) VALUES('v','owner','vault','secret://v')")
        self.db.execute("INSERT INTO agents(id,vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES('a','v','Agent','buyer','pub',1000,100)")

    def payment(self, **changes):
        data = dict(id='t', agent_id='a', recipient_pubkey='recipient', amount_lamports=10,
                    idempotency_key='request', request_hash='a'*64, decision='APPROVED',
                    settlement_status='RESERVED', reserved_at=100, fee_reserved_lamports=5)
        data.update(changes)
        self.db.execute(f"INSERT INTO transactions({','.join(data)}) VALUES({','.join('?' for _ in data)})", tuple(data.values()))

    def test_exact_amounts_and_safe_range(self):
        self.payment(amount_lamports=MAX, fee_reserved_lamports=0)
        self.assertEqual(self.db.execute('SELECT amount_lamports FROM transactions').fetchone()[0], MAX)
        for value in (-1, 0, 1.5, MAX + 1):
            with self.subTest(value=value), self.assertRaises(sqlite3.IntegrityError):
                self.payment(id=str(value), idempotency_key=str(value), amount_lamports=value)

    def test_idempotency_and_signature_unique(self):
        self.payment()
        with self.assertRaises(sqlite3.IntegrityError):
            self.payment(id='other')
        self.db.execute("UPDATE transactions SET settlement_status='SUBMITTED',solana_signature='sig',signed_transaction_reference='blob://t',submitted_at=101 WHERE id='t'")
        with self.assertRaises(sqlite3.IntegrityError):
            self.payment(id='other', idempotency_key='other', settlement_status='SUBMITTED', solana_signature='sig', signed_transaction_reference='blob://other', submitted_at=101)

    def test_foreign_keys_and_history_preserved(self):
        self.assertEqual(self.db.execute('PRAGMA foreign_keys').fetchone()[0], 1)
        with self.assertRaises(sqlite3.IntegrityError):
            self.payment(agent_id='missing')
        self.payment()
        for sql in ("DELETE FROM agents WHERE id='a'", "DELETE FROM vaults WHERE id='v'"):
            with self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(sql)
        self.db.execute("UPDATE agents SET status='FROZEN' WHERE id='a'")
        self.assertEqual(self.db.execute('SELECT count(*) FROM transactions').fetchone()[0], 1)

    def test_blocked_and_confirmed_coherence(self):
        for changes in (dict(decision='BLOCKED'), dict(settlement_status='CONFIRMED'), dict(settlement_status='NOT_SUBMITTED'), dict(settlement_status='UNKNOWN', solana_signature='sig')):
            with self.subTest(changes=changes), self.assertRaises(sqlite3.IntegrityError):
                self.payment(**changes)
        self.payment(decision='BLOCKED', settlement_status='NOT_SUBMITTED', reserved_at=None, fee_reserved_lamports=0, error_code='POLICY')
        self.payment(id='confirmed', idempotency_key='confirmed', settlement_status='CONFIRMED', solana_signature='sig', signed_transaction_reference='blob://t', submitted_at=101, confirmed_at=102)

    def test_presigned_reservation_and_safe_total(self):
        self.payment(solana_signature='prepared', signed_transaction_reference='blob://prepared')
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE transactions SET submitted_at=101 WHERE id='t'")
        with self.assertRaises(sqlite3.IntegrityError):
            self.payment(id='overflow', idempotency_key='overflow', amount_lamports=MAX, fee_reserved_lamports=1)

    def test_whitelist_and_policy_constraints(self):
        self.db.execute("INSERT INTO whitelist_recipients(id,agent_id,recipient_pubkey,label) VALUES('w','a','recipient','Provider')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO whitelist_recipients(id,agent_id,recipient_pubkey,label) VALUES('w2','a','recipient','Provider')")
        for assignment in ('whitelist_enabled=2', 'daily_cap_lamports=-1', 'single_tx_cap_lamports=1001'):
            with self.subTest(assignment=assignment), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(f'UPDATE agents SET {assignment}')

    def test_credentials_revocation_and_audit(self):
        self.db.execute("INSERT INTO agent_credentials(id,agent_id,token_hash,expires_at) VALUES('c','a',?,200)", ('b'*64,))
        self.db.execute("UPDATE agent_credentials SET revoked_at=100 WHERE id='c'")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO agent_credentials(id,agent_id,token_hash) VALUES('c2','a',?)", ('b'*64,))
        self.db.execute("INSERT INTO audit_events(id,vault_id,actor_type,actor_id,event_type,target_type,target_id) VALUES('e','v','OWNER','owner','AGENT_FROZEN','AGENT','a')")
        self.assertEqual(self.db.execute('SELECT revoked_at FROM agent_credentials').fetchone()[0], 100)

    def test_history_and_signed_identity_immutable(self):
        self.payment(solana_signature='prepared', signed_transaction_reference='blob://prepared')
        self.db.execute("INSERT INTO vaults(id,owner_pubkey,vault_pubkey,key_reference) VALUES('v2','owner','vault2','secret://v2')")
        self.db.execute("INSERT INTO audit_events(id,vault_id,actor_type,actor_id,event_type,target_type,target_id) VALUES('e','v','SYSTEM','system','PAYMENT','TRANSACTION','t')")
        statements = ["DELETE FROM transactions WHERE id='t'", "UPDATE agents SET vault_id='v2' WHERE id='a'", "DELETE FROM audit_events", "UPDATE audit_events SET reason='edited'"]
        for field, value in [('id', 'other'), ('agent_id', 'other'), ('idempotency_key', 'other'), ('request_hash', 'b'*64), ('amount_lamports', 20), ('recipient_pubkey', 'other'), ('decision', 'BLOCKED'), ('reserved_at', 101), ('solana_signature', 'replacement'), ('signed_transaction_reference', 'blob://replacement')]:
            with self.subTest(field=field), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(f'UPDATE transactions SET {field}=?', (value,))
        for sql in statements:
            with self.subTest(sql=sql), self.assertRaises(sqlite3.IntegrityError):
                self.db.execute(sql)


if __name__ == '__main__':
    unittest.main()
