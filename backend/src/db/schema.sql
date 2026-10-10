-- Initial SQLite schema (SQLite >= 3.38). Execute on a fresh database only.
-- Every application connection MUST also enable foreign_keys before BEGIN.
-- Timestamps are Unix UTC seconds; monetary values are integer lamports.
PRAGMA foreign_keys = ON;

CREATE TABLE vaults (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    owner_pubkey TEXT NOT NULL CHECK(length(trim(owner_pubkey)) > 0),
    vault_pubkey TEXT NOT NULL UNIQUE CHECK(length(trim(vault_pubkey)) > 0),
    key_reference TEXT NOT NULL CHECK(length(trim(key_reference)) > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FROZEN')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0)
) STRICT;

CREATE TABLE agents (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE RESTRICT,
    name TEXT NOT NULL CHECK(length(trim(name)) > 0),
    role TEXT NOT NULL CHECK(length(trim(role)) > 0),
    agent_pubkey TEXT NOT NULL CHECK(length(trim(agent_pubkey)) > 0),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FROZEN')),
    daily_cap_lamports INTEGER NOT NULL CHECK(daily_cap_lamports BETWEEN 0 AND 9007199254740991),
    single_tx_cap_lamports INTEGER NOT NULL CHECK(single_tx_cap_lamports BETWEEN 0 AND daily_cap_lamports),
    whitelist_enabled INTEGER NOT NULL DEFAULT 0 CHECK(whitelist_enabled IN (0, 1)),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0)
) STRICT;
CREATE INDEX agents_vault_idx ON agents(vault_id);

CREATE TABLE whitelist_recipients (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    recipient_pubkey TEXT NOT NULL CHECK(length(trim(recipient_pubkey)) > 0),
    label TEXT NOT NULL CHECK(length(trim(label)) > 0),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0),
    UNIQUE(agent_id, recipient_pubkey)
) STRICT;

CREATE TABLE transactions (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    recipient_pubkey TEXT NOT NULL CHECK(length(trim(recipient_pubkey)) > 0),
    amount_lamports INTEGER NOT NULL CHECK(amount_lamports BETWEEN 1 AND 9007199254740991),
    fee_reserved_lamports INTEGER NOT NULL DEFAULT 0 CHECK(fee_reserved_lamports BETWEEN 0 AND 9007199254740991),
    idempotency_key TEXT NOT NULL CHECK(length(trim(idempotency_key)) BETWEEN 1 AND 128),
    request_hash TEXT NOT NULL CHECK(length(request_hash) = 64 AND request_hash NOT GLOB '*[^0-9a-f]*'),
    decision TEXT NOT NULL CHECK(decision IN ('APPROVED', 'BLOCKED')),
    settlement_status TEXT NOT NULL CHECK(settlement_status IN ('NOT_SUBMITTED', 'RESERVED', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'UNKNOWN')),
    error_code TEXT,
    error_message TEXT,
    solana_signature TEXT UNIQUE CHECK(solana_signature IS NULL OR length(trim(solana_signature)) > 0),
    signed_transaction_reference TEXT CHECK(signed_transaction_reference IS NULL OR length(trim(signed_transaction_reference)) > 0),
    purpose TEXT,
    reserved_at INTEGER CHECK(reserved_at >= 0),
    submitted_at INTEGER CHECK(submitted_at >= reserved_at),
    confirmed_at INTEGER CHECK(confirmed_at >= submitted_at),
    resolved_at INTEGER CHECK(resolved_at >= reserved_at),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0),
    UNIQUE(agent_id, idempotency_key),
    CHECK(amount_lamports <= 9007199254740991 - fee_reserved_lamports),
    CHECK(settlement_status <> 'RESERVED' OR submitted_at IS NULL),
    CHECK((decision = 'BLOCKED' AND settlement_status = 'NOT_SUBMITTED' AND reserved_at IS NULL AND fee_reserved_lamports = 0 AND error_code IS NOT NULL)
       OR (decision = 'APPROVED' AND settlement_status <> 'NOT_SUBMITTED' AND reserved_at IS NOT NULL)),
    CHECK((solana_signature IS NULL) = (signed_transaction_reference IS NULL)),
    CHECK(settlement_status NOT IN ('SUBMITTED', 'CONFIRMED', 'UNKNOWN') OR (solana_signature IS NOT NULL AND submitted_at IS NOT NULL)),
    CHECK(submitted_at IS NULL OR solana_signature IS NOT NULL),
    CHECK((settlement_status = 'CONFIRMED') = (confirmed_at IS NOT NULL)),
    CHECK((settlement_status = 'FAILED') = (resolved_at IS NOT NULL)),
    CHECK(settlement_status <> 'FAILED' OR error_code IS NOT NULL),
    CHECK(settlement_status <> 'NOT_SUBMITTED' OR (solana_signature IS NULL AND submitted_at IS NULL))
) STRICT;
CREATE INDEX transactions_budget_idx ON transactions(agent_id, settlement_status, reserved_at);
CREATE INDEX transactions_reconciliation_idx ON transactions(settlement_status, submitted_at);
CREATE INDEX transactions_history_idx ON transactions(agent_id, created_at);

CREATE TABLE agent_credentials (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash) = 64 AND token_hash NOT GLOB '*[^0-9a-f]*'),
    scope TEXT NOT NULL DEFAULT 'PAY' CHECK(scope = 'PAY'),
    expires_at INTEGER CHECK(expires_at >= 0),
    revoked_at INTEGER CHECK(revoked_at >= 0),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0)
) STRICT;
CREATE INDEX agent_credentials_agent_idx ON agent_credentials(agent_id);

CREATE TABLE audit_events (
    id TEXT NOT NULL PRIMARY KEY CHECK(length(trim(id)) > 0),
    vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE RESTRICT,
    actor_type TEXT NOT NULL CHECK(actor_type IN ('OWNER', 'AGENT', 'SYSTEM')),
    actor_id TEXT NOT NULL CHECK(length(trim(actor_id)) > 0),
    event_type TEXT NOT NULL CHECK(length(trim(event_type)) > 0),
    target_type TEXT NOT NULL CHECK(target_type IN ('VAULT', 'AGENT', 'WHITELIST', 'CREDENTIAL', 'TRANSACTION')),
    target_id TEXT NOT NULL CHECK(length(trim(target_id)) > 0),
    reason TEXT,
    before_json TEXT CHECK(before_json IS NULL OR json_valid(before_json)),
    after_json TEXT CHECK(after_json IS NULL OR json_valid(after_json)),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()) CHECK(created_at >= 0)
) STRICT;
CREATE INDEX audit_events_vault_time_idx ON audit_events(vault_id, created_at);

-- Preserve ownership and original request identity while allowing reconciliation.
CREATE TRIGGER agents_vault_immutable BEFORE UPDATE OF vault_id ON agents
WHEN OLD.vault_id IS NOT NEW.vault_id
BEGIN SELECT RAISE(ABORT, 'agent vault is immutable'); END;

CREATE TRIGGER transactions_payload_immutable BEFORE UPDATE ON transactions
WHEN OLD.id IS NOT NEW.id
  OR OLD.agent_id IS NOT NEW.agent_id
  OR OLD.idempotency_key IS NOT NEW.idempotency_key
  OR OLD.request_hash IS NOT NEW.request_hash
  OR OLD.amount_lamports IS NOT NEW.amount_lamports
  OR OLD.recipient_pubkey IS NOT NEW.recipient_pubkey
  OR OLD.decision IS NOT NEW.decision
  OR OLD.reserved_at IS NOT NEW.reserved_at
  OR OLD.created_at IS NOT NEW.created_at
  OR OLD.purpose IS NOT NEW.purpose
  OR (OLD.solana_signature IS NOT NULL AND OLD.solana_signature IS NOT NEW.solana_signature)
  OR (OLD.signed_transaction_reference IS NOT NULL AND OLD.signed_transaction_reference IS NOT NEW.signed_transaction_reference)
BEGIN SELECT RAISE(ABORT, 'payment identity is immutable'); END;

CREATE TRIGGER transactions_preserve_history BEFORE DELETE ON transactions
BEGIN SELECT RAISE(ABORT, 'payment history cannot be deleted'); END;

CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit events are append-only'); END;

CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN SELECT RAISE(ABORT, 'audit events are append-only'); END;
