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
  }) {
    const sql = `
      INSERT INTO transactions (
        agent_id, idempotency_key, request_hash, recipient_pubkey, 
        amount_lamports, decision, settlement_status, purpose
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      data.agent_id, data.idempotency_key, data.request_hash,
      data.recipient_pubkey, data.amount_lamports, data.decision,
      data.settlement_status, data.purpose
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
}
