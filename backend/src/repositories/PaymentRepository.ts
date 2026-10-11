import pool from '../db/database';
import { PoolClient } from 'pg';
export type Owner = {
    user_id: string;
    owner_pubkey: string;
};
export const paymentError = (message: string, status = 409) => Object.assign(new Error(message), { status });
export const publicPayment = (t: any) => {
    const { signed_tx_reference, request_hash, encrypted_key, ...safe } = t;
    return safe;
};
export class PaymentRepository {
    constructor(private database: Pick<typeof pool,'query'|'connect'> = pool) {}
    begin(c: PoolClient) {
        return c.query('BEGIN');
    }
    commit(c: PoolClient) {
        return c.query('COMMIT');
    }
    rollback(c: PoolClient) {
        return c.query('ROLLBACK');
    }
    async createVault(c: PoolClient, owner: Owner, address: string, cap: string) {
        return (await c.query("INSERT INTO vaults(user_id,owner_pubkey,vault_pubkey,key_reference,execution_mode,daily_cap_lamports) VALUES($1,$2,$3,'encrypted-devnet-signer','AUTOMATIC',$4) RETURNING id,user_id,owner_pubkey,vault_pubkey,status,execution_mode,mode_version,daily_cap_lamports,policies,created_at", [owner.user_id, owner.owner_pubkey, address, cap])).rows[0];
    }
    storeSigner(c: PoolClient, vaultId: string, address: string, ciphertext: string) {
        return c.query('INSERT INTO vault_signers(vault_id,public_key,encrypted_key) VALUES($1,$2,$3)', [vaultId, address, ciphertext]);
    }
    setCap(c: PoolClient, id: string, cap: string) {
        return c.query('UPDATE vaults SET daily_cap_lamports=$2 WHERE id=$1', [id, cap]);
    }
    setMode(c: PoolClient, id: string, mode: string) {
        return c.query('UPDATE vaults SET execution_mode=$2,mode_version=mode_version+1 WHERE id=$1', [id, mode]);
    }
    requireQueuedApproval(c: PoolClient, id: string) {
        return c.query("UPDATE transactions SET approval_status='PENDING',approved_by=NULL,approved_at=NULL WHERE agent_id IN(SELECT id FROM agents WHERE vault_id=$1) AND settlement_status IN ('NOT_SUBMITTED','RESERVED') AND dispatch_started_at IS NULL AND decision='APPROVED'", [id]);
    }
    async issueCredential(c: PoolClient, agentId: string, tokenHash: string, ttl: number) {
        return (await c.query("INSERT INTO agent_credentials(agent_id,token_hash,scope,expires_at) VALUES($1,$2,'payments:create',NOW()+$3*INTERVAL '1 second') RETURNING id,agent_id,scope,expires_at,created_at", [agentId, tokenHash, ttl])).rows[0];
    }
    async revokeCredential(c: PoolClient, credentialId: string, agentId: string) {
        return (await c.query('UPDATE agent_credentials SET revoked_at=NOW() WHERE id=$1 AND agent_id=$2 RETURNING id', [credentialId, agentId])).rows[0];
    }
    async validCredential(c: PoolClient, id: string, lock = false) {
        return (await c.query('SELECT id FROM agent_credentials WHERE id=$1 AND revoked_at IS NULL AND expires_at>NOW()' + (lock ? ' FOR SHARE' : ''), [id])).rows[0];
    }
    async listed(c: PoolClient, agentId: string, recipient: string) {
        return (await c.query('SELECT 1 FROM whitelist_recipients WHERE agent_id=$1 AND recipient_pubkey=$2', [agentId, recipient])).rowCount! > 0;
    }
    async prior(c: PoolClient, agentId: string, key: string) {
        return (await c.query('SELECT * FROM transactions WHERE agent_id=$1 AND idempotency_key=$2', [agentId, key])).rows[0];
    }
    async payment(c: PoolClient, id: string, lock = false) {
        return (await c.query('SELECT * FROM transactions WHERE id=$1' + (lock ? ' FOR UPDATE' : ''), [id])).rows[0];
    }
    async insertRequest(c: PoolClient, data: any, requestHash: string, credentialId: string | null, approval: string, blockedReason?: string) {
        return (await c.query("INSERT INTO transactions(agent_id,idempotency_key,request_hash,recipient_pubkey,amount_lamports,purpose,credential_id,decision,settlement_status,approval_status,error_code,resolved_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'NOT_SUBMITTED',$9,$10::text,CASE WHEN $10::text IS NULL THEN NULL ELSE NOW() END) RETURNING *", [data.agent_id, data.idempotency_key, requestHash, data.recipient_pubkey, data.amount_lamports, data.purpose, credentialId, blockedReason ? 'BLOCKED' : 'APPROVED', approval, blockedReason ?? null])).rows[0];
    }
    async persistDispatch(c: PoolClient, id: string, prepared: {
        fee: bigint;
        bytes: string;
        signature: string;
        blockhash: string;
        lastValidBlockHeight: number;
    }) {
        return (await c.query("UPDATE transactions SET settlement_status='SUBMITTED',network_fee_lamports=$2,signed_tx_reference=$3,solana_signature=$4,recent_blockhash=$5,last_valid_block_height=$6,reserved_at=COALESCE(reserved_at,NOW()),dispatch_started_at=NOW(),submitted_at=NOW() WHERE id=$1 RETURNING *", [id, prepared.fee.toString(), prepared.bytes, prepared.signature, prepared.blockhash, prepared.lastValidBlockHeight])).rows[0];
    }
    markUnknown(c: PoolClient, id: string, code: string) {
        return c.query("UPDATE transactions SET settlement_status='UNKNOWN',error_code=$2 WHERE id=$1", [id, code]);
    }
    async settle(c: PoolClient, id: string, state: string, fee: string) {
        await this.begin(c);
        try {
            const row = (await c.query("UPDATE transactions SET settlement_status=$2::tx_settlement,actual_fee_lamports=$3,confirmed_at=CASE WHEN $2::tx_settlement='CONFIRMED' THEN NOW() ELSE NULL END,resolved_at=NOW(),error_code=CASE WHEN $2::tx_settlement='FAILED' THEN 'ONCHAIN_FAILED' ELSE NULL END WHERE id=$1 RETURNING *", [id, state, fee])).rows[0];
            const agent = (await c.query('SELECT vault_id FROM agents WHERE id=$1', [row.agent_id])).rows[0];
            await this.audit(c, agent.vault_id, 'payment-executor', 'PAYMENT_' + state, id, null, { settlement_status: state, actual_fee_lamports: fee, signature: row.solana_signature });
            await this.commit(c);
            return row;
        }
        catch (error) {
            await this.rollback(c);
            throw error;
        }
    }
    approve(c: PoolClient, id: string, owner: string) {
        return c.query("UPDATE transactions SET approval_status='APPROVED',approved_by=$2,approved_at=NOW() WHERE id=$1", [id, owner]);
    }
    async reject(c: PoolClient, id: string) {
        return (await c.query("UPDATE transactions SET approval_status='REJECTED',decision='BLOCKED',error_code='OWNER_REJECTED',resolved_at=NOW() WHERE id=$1 RETURNING *", [id])).rows[0];
    }
    markReconciled(c: PoolClient, id: string) {
        return c.query('UPDATE transactions SET last_reconciled_at=NOW() WHERE id=$1', [id]);
    }
    async transaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
        const c = await this.database.connect();
        try {
            await c.query('BEGIN');
            const value = await fn(c);
            await c.query('COMMIT');
            return value;
        }
        catch (e) {
            await c.query('ROLLBACK');
            throw e;
        }
        finally {
            c.release();
        }
    }
    // Session lock survives COMMIT between durable dispatch intent and RPC call.
    async locked<T>(vaultId: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
        const c = await this.database.connect();
        try {
            await c.query('SELECT pg_advisory_lock(hashtext($1))', [vaultId]);
            return await fn(c);
        }
        finally {
            await c.query('SELECT pg_advisory_unlock(hashtext($1))', [vaultId]);
            c.release();
        }
    }
    async vault(c: PoolClient, id: string, owner?: Owner) {
        const row = (await c.query('SELECT v.*,s.encrypted_key,s.public_key signer_pubkey FROM vaults v LEFT JOIN vault_signers s ON s.vault_id=v.id WHERE v.id=$1' + (owner ? ' AND v.user_id=$2 AND v.owner_pubkey=$3' : '') + ' FOR UPDATE OF v', owner ? [id, owner.user_id, owner.owner_pubkey] : [id])).rows[0];
        if (!row)
            throw paymentError('Vault not found', 404);
        return row;
    }
    async agent(c: PoolClient, id: string) {
        const a = (await c.query('SELECT * FROM agents WHERE id=$1 FOR UPDATE', [id])).rows[0];
        if (!a)
            throw paymentError('Agent not found', 404);
        return a;
    }
    async vaultIdForAgent(id: string) {
        const a = (await this.database.query('SELECT vault_id FROM agents WHERE id=$1', [id])).rows[0];
        if (!a)
            throw paymentError('Agent not found', 404);
        return a.vault_id as string;
    }
    async vaultIdForPayment(id: string) {
        const a = (await this.database.query('SELECT a.vault_id FROM transactions t JOIN agents a ON a.id=t.agent_id WHERE t.id=$1', [id])).rows[0];
        if (!a)
            throw paymentError('Payment not found', 404);
        return a.vault_id as string;
    }
    async credential(c: PoolClient, hash: string, agentId: string) {
        const row = (await c.query("SELECT * FROM agent_credentials WHERE agent_id=$1 AND token_hash=$2 AND scope='payments:create' AND revoked_at IS NULL AND expires_at>NOW() FOR SHARE", [agentId, hash])).rows[0];
        if (!row)
            throw paymentError('Agent credential invalid or expired', 401);
        return row;
    }
    async usage(c: PoolClient, agentId: string, vaultId: string, exclude: string | null) {
        return (await c.query(`SELECT
 COALESCE(SUM(t.amount_lamports) FILTER(WHERE t.agent_id=$1 AND (t.settlement_status IN ('RESERVED','SUBMITTED','UNKNOWN') OR (t.settlement_status='CONFIRMED' AND t.reserved_at>NOW()-INTERVAL '24 hours'))),0)::text agent_spent,
 COALESCE(SUM(CASE WHEN t.settlement_status='FAILED' THEN COALESCE(t.actual_fee_lamports,0) ELSE t.amount_lamports+COALESCE(t.actual_fee_lamports,t.network_fee_lamports,0) END) FILTER(WHERE t.settlement_status IN ('RESERVED','SUBMITTED','UNKNOWN') OR (t.settlement_status='CONFIRMED' AND t.reserved_at>NOW()-INTERVAL '24 hours') OR (t.settlement_status='FAILED' AND t.resolved_at>NOW()-INTERVAL '24 hours')),0)::text vault_spent,
 COALESCE(SUM(t.amount_lamports+COALESCE(t.network_fee_lamports,0)) FILTER(WHERE t.settlement_status IN ('RESERVED','SUBMITTED','UNKNOWN')),0)::text pending_balance,
 COALESCE(SUM(CASE WHEN t.settlement_status='FAILED' THEN COALESCE(t.actual_fee_lamports,0) ELSE t.amount_lamports+COALESCE(t.actual_fee_lamports,t.network_fee_lamports,0) END) FILTER(WHERE (t.settlement_status='CONFIRMED' AND t.reserved_at>NOW()-INTERVAL '24 hours') OR (t.settlement_status='FAILED' AND t.resolved_at>NOW()-INTERVAL '24 hours')),0)::text settled_spent
 FROM transactions t JOIN agents a ON a.id=t.agent_id WHERE a.vault_id=$2 AND ($3::uuid IS NULL OR t.id<>$3) AND t.decision='APPROVED'`, [agentId, vaultId, exclude])).rows[0];
    }
    async audit(c: PoolClient, vault: string, actor: string, action: string, target: string, before: any = null, after: any = null) {
        await c.query('INSERT INTO audit_events(vault_id,actor_id,action,target_id,before_state,after_state) VALUES($1,$2,$3,$4,$5,$6)', [vault, actor, action, target, before, after]);
    }
    async list(owner: Owner, filter: {
        approval_status?: string;
        vault_id?: string;
        limit?: number;
        offset?: number;
    } = {}) {
        return (await this.database.query('SELECT t.*,a.vault_id,a.name agent_name FROM transactions t JOIN agents a ON a.id=t.agent_id JOIN vaults v ON v.id=a.vault_id WHERE v.user_id=$1 AND v.owner_pubkey=$2 AND ($3::text IS NULL OR t.approval_status=$3) AND ($4::uuid IS NULL OR v.id=$4) ORDER BY t.created_at DESC,t.id LIMIT $5 OFFSET $6', [owner.user_id, owner.owner_pubkey, filter.approval_status ?? null, filter.vault_id ?? null, filter.limit ?? 100, filter.offset ?? 0])).rows.map(publicPayment);
    }
    async detail(owner: Owner, id: string) {
        const row = (await this.database.query('SELECT t.*,a.vault_id,a.name agent_name FROM transactions t JOIN agents a ON a.id=t.agent_id JOIN vaults v ON v.id=a.vault_id WHERE t.id=$1 AND v.user_id=$2 AND v.owner_pubkey=$3', [id, owner.user_id, owner.owner_pubkey])).rows[0];
        if (!row)
            throw paymentError('Payment not found', 404);
        return publicPayment(row);
    }
    async pending() {
        return (await this.database.query("SELECT t.id,a.vault_id FROM transactions t JOIN agents a ON a.id=t.agent_id WHERE t.settlement_status IN ('RESERVED','SUBMITTED','UNKNOWN') AND t.signed_tx_reference IS NOT NULL ORDER BY t.last_reconciled_at NULLS FIRST,t.created_at LIMIT 100")).rows;
    }
}
