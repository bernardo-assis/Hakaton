-- Additive and rerunnable. Existing external-owner vaults remain without a signer.
BEGIN;
ALTER TABLE vaults ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'MANUAL' CHECK(execution_mode IN ('AUTOMATIC','MANUAL'));
ALTER TABLE vaults ALTER COLUMN execution_mode SET DEFAULT 'MANUAL';
ALTER TABLE vaults ADD COLUMN IF NOT EXISTS daily_cap_lamports BIGINT NOT NULL DEFAULT 1000000000 CHECK(daily_cap_lamports>0);
ALTER TABLE vaults ADD COLUMN IF NOT EXISTS mode_version BIGINT NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS vault_signers (
  vault_id UUID PRIMARY KEY REFERENCES vaults(id) ON DELETE CASCADE,
  public_key VARCHAR(44) NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'devnet' CHECK(network='devnet'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Legacy observation wallets have no signing authority and remain manual.
UPDATE vaults SET execution_mode='MANUAL' WHERE execution_mode='AUTOMATIC' AND NOT EXISTS(SELECT 1 FROM vault_signers WHERE vault_id=vaults.id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK(approval_status IN ('NOT_REQUIRED','PENDING','APPROVED','REJECTED'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approved_by VARCHAR(44);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES agent_credentials(id) ON DELETE RESTRICT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_valid_block_height BIGINT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recent_blockhash VARCHAR(44);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS dispatch_started_at TIMESTAMPTZ;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS actual_fee_lamports BIGINT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_transactions_reconcile ON transactions(settlement_status) WHERE signed_tx_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_window ON transactions(agent_id,reserved_at) WHERE decision='APPROVED';
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='payment_positive_values') THEN
  ALTER TABLE transactions ADD CONSTRAINT payment_positive_values CHECK(amount_lamports>0 AND network_fee_lamports>=0 AND (actual_fee_lamports IS NULL OR actual_fee_lamports>=0)) NOT VALID;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='agent_positive_caps') THEN
  ALTER TABLE agents ADD CONSTRAINT agent_positive_caps CHECK(daily_cap_lamports>0 AND single_tx_cap_lamports>0 AND single_tx_cap_lamports<=daily_cap_lamports) NOT VALID;
 END IF;
END $$;
COMMIT;
