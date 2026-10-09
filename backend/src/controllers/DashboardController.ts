import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { query } from '../db/database';
import { SolanaService } from '../services/solanaService';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export class DashboardController extends BaseController {
  private solanaService: SolanaService;
  
  constructor() {
    super();
    this.solanaService = new SolanaService();
  }

  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const vaultResult = await query('SELECT * FROM vaults LIMIT 1');
      const vault = vaultResult.rows[0];

      if (!vault) {
        this.handleSuccess(res, { balanceSol: 0, dailyLimitSol: 0, spentTodaySol: 0, transactions: [] }, 200);
        return;
      }

      let balanceSol = 0;
      try {
        const balance = await this.solanaService['connection'].getBalance(new PublicKey(vault.vault_pubkey));
        balanceSol = balance / LAMPORTS_PER_SOL;
      } catch(e) {}

      const agentsResult = await query('SELECT COALESCE(SUM(daily_cap_lamports), 0) as total_cap FROM agents WHERE vault_id = $1', [vault.id]);
      const dailyLimitSol = Number(agentsResult.rows[0].total_cap) / LAMPORTS_PER_SOL;

      const today = new Date();
      today.setUTCHours(0,0,0,0);
      const spentResult = await query(
        "SELECT COALESCE(SUM(amount_lamports), 0) as total_spent FROM transactions WHERE agent_id IN (SELECT id FROM agents WHERE vault_id = $1) AND decision = 'APPROVED' AND created_at >= $2", 
        [vault.id, today.toISOString()]
      );
      const spentTodaySol = Number(spentResult.rows[0].total_spent) / LAMPORTS_PER_SOL;

      const activeAgentsResult = await query("SELECT COUNT(*) as count FROM agents WHERE vault_id =  AND status = 'ACTIVE'", [vault.id]);
      const activeAgents = Number(activeAgentsResult.rows[0].count);

      const blockedTxsResult = await query(
        "SELECT COUNT(*) as count FROM transactions WHERE agent_id IN (SELECT id FROM agents WHERE vault_id = ) AND decision = 'BLOCKED'",
        [vault.id]
      );
      const blockedTxs = Number(blockedTxsResult.rows[0].count);

      const txResult = await query(
        "SELECT id, amount_lamports, decision, created_at, purpose FROM transactions WHERE agent_id IN (SELECT id FROM agents WHERE vault_id = $1) ORDER BY created_at DESC LIMIT 5", 
        [vault.id]
      );

      const chartResult = await query(
        "SELECT DATE(created_at) as date_val, COUNT(*) filter (where decision = 'APPROVED') as approved, COUNT(*) filter (where decision = 'BLOCKED') as blocked FROM transactions WHERE agent_id IN (SELECT id FROM agents WHERE vault_id = $1) AND created_at >= NOW() - INTERVAL '7 days' GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC",
        [vault.id]
      );
      
      const chartDataMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setUTCHours(0,0,0,0);
        d.setDate(d.getDate() - i);
        chartDataMap.set(d.toISOString().split('T')[0], { approved: 0, blocked: 0 });
      }

      for (const row of chartResult.rows) {
        const dateStr = new Date(row.date_val).toISOString().split('T')[0];
        if (chartDataMap.has(dateStr)) {
          chartDataMap.set(dateStr, {
            approved: Number(row.approved),
            blocked: Number(row.blocked)
          });
        }
      }

      const chartData = Array.from(chartDataMap.entries()).map(([date, data]) => ({ date, ...data }));
      
      const transactions = txResult.rows.map(tx => ({
        id: tx.id,
        amountSol: Number(tx.amount_lamports) / LAMPORTS_PER_SOL,
        status: tx.decision,
        date: tx.created_at,
        purpose: tx.purpose
      }));

      this.handleSuccess(res, {
        vaultPubkey: vault.vault_pubkey,
        balanceSol,
        dailyLimitSol,
        spentTodaySol,
        activeAgents,
        blockedTxs,
        transactions,
        chartData
      }, 200);
    } catch (error) {
      this.handleError(error, res, 'getDashboardStats');
    }
  }

  async deposit(req: Request, res: Response): Promise<void> {
    try {
      const { amountSol } = req.body;
      const vaultResult = await query('SELECT * FROM vaults LIMIT 1');
      const vault = vaultResult.rows[0];
      if (!vault) throw new Error('No vault found');

      await this.solanaService.requestAirdrop(vault.vault_pubkey, amountSol || 1);
      
      this.handleSuccess(res, { success: true }, 200);
    } catch (error) {
      this.handleError(error, res, 'deposit');
    }
  }
}


