import { query } from '../db/database';

export interface CreateAgentDTO {
  vault_id: string;
  name: string;
  role: string;
  agent_pubkey: string;
  daily_cap_lamports: bigint | number | string;
  single_tx_cap_lamports: bigint | number | string;
  whitelist_enabled?: boolean;
}

export class AgentRepository {
  async listAgents() {
    // In production we would filter by vault_id or user_id
    const res = await query(
      `SELECT id, vault_id, name, role, agent_pubkey, status, daily_cap_lamports, single_tx_cap_lamports, whitelist_enabled, created_at FROM agents`
    );
    return res.rows.map(row => ({
      ...row,
      daily_cap_lamports: BigInt(row.daily_cap_lamports),
      single_tx_cap_lamports: BigInt(row.single_tx_cap_lamports)
    }));
  }

  async createAgent(data: CreateAgentDTO) {
    const res = await query(
      `INSERT INTO agents (vault_id, name, role, agent_pubkey, daily_cap_lamports, single_tx_cap_lamports, whitelist_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.vault_id,
        data.name,
        data.role,
        data.agent_pubkey,
        data.daily_cap_lamports.toString(),
        data.single_tx_cap_lamports.toString(),
        data.whitelist_enabled ?? false
      ]
    );

    const row = res.rows[0];
    return {
      ...row,
      daily_cap_lamports: BigInt(row.daily_cap_lamports),
      single_tx_cap_lamports: BigInt(row.single_tx_cap_lamports)
    };
  }

  async getAgentById(agentId: string) {
    const res = await query(
      `SELECT * FROM agents WHERE id = $1`,
      [agentId]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      daily_cap_lamports: BigInt(row.daily_cap_lamports),
      single_tx_cap_lamports: BigInt(row.single_tx_cap_lamports)
    };
  }
}
