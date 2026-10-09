-- Migration 0001: Initial Schema for AgentSafe (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE vault_status AS ENUM ('ACTIVE', 'FROZEN');
CREATE TYPE agent_status AS ENUM ('ACTIVE', 'FROZEN');
CREATE TYPE tx_decision AS ENUM ('APPROVED', 'BLOCKED');
CREATE TYPE tx_settlement AS ENUM ('NOT_SUBMITTED', 'RESERVED', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'UNKNOWN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    owner_pubkey VARCHAR(44) NOT NULL,
    vault_pubkey VARCHAR(44) NOT NULL,
    key_reference VARCHAR(255) NOT NULL,
    status vault_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(200) NOT NULL,
    agent_pubkey VARCHAR(44) NOT NULL,
    status agent_status DEFAULT 'ACTIVE',
    daily_cap_lamports BIGINT NOT NULL,
    single_tx_cap_lamports BIGINT NOT NULL,
    whitelist_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    scope VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE whitelist_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    recipient_pubkey VARCHAR(44) NOT NULL,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, recipient_pubkey)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(100) NOT NULL,
    request_hash VARCHAR(255) NOT NULL,
    recipient_pubkey VARCHAR(44) NOT NULL,
    amount_lamports BIGINT NOT NULL,
    network_fee_lamports BIGINT DEFAULT 0,
    decision tx_decision NOT NULL,
    settlement_status tx_settlement NOT NULL,
    error_code VARCHAR(100),
    purpose TEXT,
    solana_signature VARCHAR(88) UNIQUE,
    signed_tx_reference TEXT,
    reserved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, idempotency_key)
);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    actor_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    reason TEXT,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_agent_status ON transactions(agent_id, settlement_status);
CREATE INDEX idx_transactions_reserved_at ON transactions(reserved_at);
CREATE INDEX idx_audit_vault ON audit_events(vault_id);
