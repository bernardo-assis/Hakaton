// Review-only reproduction. Assertions capture the current incorrect behavior,
// not the acceptance criteria for a repaired executor. All RPCs are mocked.
jest.mock('@solana/web3.js', () => ({ Connection: class {}, PublicKey: class {
  constructor(private value: string) {} toBase58() { return this.value; }
} }));
const preparedSenders: string[] = [];
jest.mock('../services/paymentNetwork', () => ({
  ...jest.requireActual('../services/paymentNetwork'),
  DevnetPaymentNetwork: class {
    async guard() {}
    async balance() { return 1000000n; }
    async prepare(secret: Buffer) {
      preparedSenders.push(jest.requireActual('../services/paymentNetwork').base58(secret.subarray(32)));
      return { fee: 5000n, bytes: Buffer.from('review-fixture').toString('base64'), signature: require('crypto').randomUUID(), blockhash: '11111111111111111111111111111111', lastValidBlockHeight: 100 };
    }
    async send() {}
    async status() { return { state: 'CONFIRMED', fee: 5000n }; }
  },
}));
import request from 'supertest';
import app from '../app';
import pool from '../db/database';
import { config } from '../config/unifiedConfig';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { login, origin } from '../testUtils/walletSession';
let session: any, vaultA: any, vaultB: any, agent: any;
const post = (path: string, body: any) => request(app).post(path).set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', session.cookie).send(body);
const patch = (path: string, body: any) => request(app).patch(path).set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', session.cookie).send(body);
const get = (path: string) => request(app).get(path).set('Cookie', session.cookie);
const intent = (key: string, amount: string) => ({ agent_id: agent.id, idempotency_key: key, recipient_pubkey: session.pubkey, amount_lamports: amount });
beforeAll(async () => {
  config.payments.signerEncryptionKey = Buffer.alloc(32, 13).toString('base64');
  config.payments.enabled = true;
  session = await login();
  const a = await post('/api/vaults/devnet', { daily_cap_lamports: '100000' });
  const b = await post('/api/vaults/devnet', { daily_cap_lamports: '100000' });
  expect(a.status).toBe(201); expect(b.status).toBe(201);
  vaultA = a.body.data; vaultB = b.body.data;
  const created = await post('/api/agents', { vault_id: vaultA.id, name: 'Review-only move regression', role: 'Fixture', agent_pubkey: session.pubkey, daily_cap_lamports: '100000', single_tx_cap_lamports: '100000' });
  expect(created.status).toBe(201); agent = created.body.data;
});
afterAll(async () => {
  jest.restoreAllMocks();
  if (session) {
    const u = (await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1', [session.pubkey])).rows[0];
    if (u) {
      await pool.query('DELETE FROM transactions WHERE agent_id IN (SELECT id FROM agents WHERE vault_id IN (SELECT id FROM vaults WHERE user_id=$1))', [u.user_id]);
      await pool.query('DELETE FROM vaults WHERE user_id=$1', [u.user_id]);
      await pool.query('DELETE FROM auth_sessions WHERE user_id=$1', [u.user_id]);
      await pool.query('DELETE FROM wallet_identities WHERE user_id=$1', [u.user_id]);
      await pool.query('DELETE FROM users WHERE id=$1', [u.user_id]);
    }
    await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1', [session.pubkey]);
  }
  await pool.end();
});
test('REPRO: moving an agent reattributes already confirmed principal and fees', async () => {
  const p = await post('/api/payments', intent('confirmed-A', '10000'));
  expect(p.status).toBe(200); expect(p.body.data.settlement_status).toBe('CONFIRMED');
  expect(preparedSenders.at(-1)).toBe(vaultA.vault_pubkey);
  expect((await get(`/api/vaults/${vaultA.id}/payment-config`)).body.data.spent_24h_lamports).toBe('15000');
  expect((await patch(`/api/agents/${agent.id}`, { vault_id: vaultB.id })).status).toBe(200);
  expect((await get(`/api/vaults/${vaultA.id}/payment-config`)).body.data.spent_24h_lamports).toBe('0');
  expect((await get(`/api/vaults/${vaultB.id}/payment-config`)).body.data.spent_24h_lamports).toBe('15000');
  const detail = await get(`/api/payments/${p.body.data.id}`);
  expect(detail.body.data.vault_id).toBe(vaultB.id);
  console.info('REPRO confirmed: signer A; after move spent A=0, B=15000; payment detail reports B.');
});
test('REPRO: a pending request created for vault B is approved with vault A signer after move', async () => {
  expect((await patch(`/api/vaults/${vaultB.id}/payment-config`, { execution_mode: 'MANUAL', expected_mode_version: '1' })).status).toBe(200);
  const p = await post('/api/payments', intent('pending-B', '20000'));
  expect(p.status).toBe(200); expect(p.body.data.approval_status).toBe('PENDING');
  expect(preparedSenders.at(-1)).toBe(vaultB.vault_pubkey);
  expect((await patch(`/api/agents/${agent.id}`, { vault_id: vaultA.id })).status).toBe(200);
  const queueB = await get(`/api/payments?vault_id=${vaultB.id}&approval_status=PENDING`);
  const queueA = await get(`/api/payments?vault_id=${vaultA.id}&approval_status=PENDING`);
  expect(queueB.body.data).toHaveLength(0);
  expect(queueA.body.data.some((x: any) => x.id === p.body.data.id)).toBe(true);
  const approved = await post(`/api/payments/${p.body.data.id}/approve`, { expected_mode_version: '1' });
  expect(approved.status).toBe(200); expect(approved.body.data.settlement_status).toBe('CONFIRMED');
  expect(preparedSenders.at(-1)).toBe(vaultA.vault_pubkey);
  console.info('REPRO pending: request queued for B moved to A and approval signed with A.');
});
test('REPRO: stale vault lookup is not revalidated after an intervening move', async () => {
  const original = PaymentRepository.prototype.vaultIdForAgent;
  let interleaved = false;
  const spy = jest.spyOn(PaymentRepository.prototype, 'vaultIdForAgent').mockImplementation(async function (this: PaymentRepository, id: string) {
    const oldVault = await original.call(this, id);
    if (id === agent.id && !interleaved) {
      interleaved = true;
      expect((await patch(`/api/agents/${agent.id}`, { vault_id: vaultB.id })).status).toBe(200);
    }
    return oldVault;
  });
  const p = await post('/api/payments', intent('stale-binding', '5000'));
  spy.mockRestore();
  expect(p.status).toBe(200); expect(p.body.data.settlement_status).toBe('CONFIRMED');
  expect(preparedSenders.at(-1)).toBe(vaultA.vault_pubkey);
  const detail = await get(`/api/payments/${p.body.data.id}`);
  expect(detail.body.data.vault_id).toBe(vaultB.id);
  console.info('REPRO race: lookup A, intervening move to B, signed using A, history reports B.');
});
