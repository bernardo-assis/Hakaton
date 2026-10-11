import { query } from '../db/database';

export class TransactionRepository {
  async createTransaction(data: {
    agent_id: string;
    idempotency_key: string;
    request_hash: string;
    recipient_pubkey: string;
    amount_lamports: number;
    decision: 'APPROVED' | 'BLOCKED';
    settlement_status: 'NOT_SUBMITTED' | 'RESERVED' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED' | 'UNKNOWN';
    purpose?: string;
    error_code?: string;
  }) {
    const sql = `
      INSERT INTO transactions (
        agent_id, idempotency_key, request_hash, recipient_pubkey, 
        amount_lamports, decision, settlement_status, purpose, error_code,
        reserved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const now = data.decision === 'APPROVED' ? new Date() : null;
    const values = [
      data.agent_id, data.idempotency_key, data.request_hash,
      data.recipient_pubkey, data.amount_lamports, data.decision,
      data.settlement_status, data.purpose, data.error_code || null,
      now
    ];
    const res = await query(sql, values);
    return res.rows[0];
  }

  async updateStatusAndSignature(id: string, signature: string, status: 'CONFIRMED' | 'FAILED') {
    const sql = `
      UPDATE transactions 
      SET solana_signature = $1, settlement_status = $2, 
          confirmed_at = $3, resolved_at = $4
      WHERE id = $5
      RETURNING *;
    `;
    const now = new Date();
    const values = [signature, status, status === 'CONFIRMED' ? now : null, now, id];
    const res = await query(sql, values);
    return res.rows[0];
  }

  async getDailySpentLamports(agentId: string): Promise<bigint> {
    const sql = `
      SELECT COALESCE(SUM(amount_lamports), 0) as total
      FROM transactions
      WHERE agent_id = $1
        AND decision = 'APPROVED'
        AND settlement_status IN ('CONFIRMED', 'SUBMITTED', 'RESERVED')
        AND created_at >= CURRENT_DATE;
    `;
    const res = await query(sql, [agentId]);
    return BigInt(res.rows[0].total || 0);
  }

  async getValidationContext(
    agentId: string,
    recipientPubkey: string,
    identity?: { user_id?: string; owner_pubkey?: string }
  ) {
    const params: any[] = [agentId];
    let ownerFilter = "";
    if (identity?.user_id && identity?.owner_pubkey) {
      params.push(identity.user_id, identity.owner_pubkey);
      ownerFilter = " AND v.user_id = $2 AND v.owner_pubkey = $3";
    }

    const agentRes = await query(
      `SELECT a.*, v.status as vault_status, v.policies, v.vault_pubkey 
       FROM agents a
       JOIN vaults v ON a.vault_id = v.id
       WHERE a.id = $1${ownerFilter}`,
      params
    );
    if (!agentRes.rows[0]) return null;
    
    const whitelistRes = await query(
      `SELECT 1 FROM whitelist_recipients WHERE agent_id = $1 AND recipient_pubkey = $2`,
      [agentId, recipientPubkey]
    );
    
    const row = agentRes.rows[0];
    return {
      agent: {
        ...row,
        daily_cap_lamports: BigInt(row.daily_cap_lamports),
        single_tx_cap_lamports: BigInt(row.single_tx_cap_lamports)
      },
      policies: row.policies, // JSONB
      isWhitelisted: whitelistRes.rows.length > 0
    };
  }
}
