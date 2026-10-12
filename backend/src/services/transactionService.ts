import { TransactionRepository } from '../repositories/TransactionRepository';
import { AgentRepository } from '../repositories/AgentRepository';
import { SolanaService } from './solanaService';
import { config } from '../config/unifiedConfig';
import { CreateTransactionInput } from '../validators/transaction.schema';

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly agentRepository: AgentRepository,
    private readonly solanaService: SolanaService
  ) {}

  async processTransaction(
    data: CreateTransactionInput,
    identity?: { user_id: string; owner_pubkey: string }
  ) {
    // 1. Fetch validation context (enforcing wallet ownership)
    const ctx = await this.transactionRepository.getValidationContext(
      data.agent_id,
      data.recipient_pubkey,
      identity
    );
    if (!ctx) {
      throw new Error('Agent not found or unauthorized');
    }

    const { agent, isWhitelisted } = ctx;
    const policies = typeof ctx.policies === 'string' ? JSON.parse(ctx.policies) : ctx.policies;
    const amount = BigInt(data.amount_lamports);
    const spent = await this.transactionRepository.getDailySpentLamports(data.agent_id);

    // 2. Validate policies
    let reason: string | null = null;

    if (agent.status !== 'ACTIVE') reason = 'AGENT_FROZEN';
    else if (agent.vault_status !== 'ACTIVE') reason = 'VAULT_FROZEN';
    else if (amount > agent.single_tx_cap_lamports) reason = 'SINGLE_TX_CAP_EXCEEDED';
    else if (spent + amount > agent.daily_cap_lamports) reason = 'DAILY_CAP_EXCEEDED';
    else if ((agent.whitelist_enabled || policies.block_unlisted_recipients) && !isWhitelisted) reason = 'RECIPIENT_NOT_ALLOWED';
    else if (policies.require_human_approval && amount > BigInt(policies.approval_threshold_lamports)) reason = 'APPROVAL_REQUIRED';
    else if (policies.pause_on_low_balance) {
      const balanceStr = await this.solanaService.getBalance(agent.vault_pubkey);
      if (!balanceStr) reason = 'BALANCE_UNAVAILABLE';
      else if (BigInt(balanceStr) - amount < BigInt(policies.low_balance_threshold_lamports)) reason = 'LOW_BALANCE';
    }

    if (reason) {
      await this.recordBlockedTransaction(data, reason);
      throw new Error(`Policy violation: ${reason}`);
    }

    // 3. Record approved transaction
    const transaction = await this.transactionRepository.createTransaction({
      agent_id: data.agent_id,
      idempotency_key: data.idempotency_key,
      request_hash: data.request_hash,
      recipient_pubkey: data.recipient_pubkey,
      amount_lamports: data.amount_lamports,
      decision: 'APPROVED',
      settlement_status: 'SUBMITTED',
      purpose: data.purpose,
    });

    // 4. Execute on Solana
    let signature: string;
    try {
      const secretKeyArray = JSON.parse(config.solana.treasurySecretKey);
      const secretKey = new Uint8Array(secretKeyArray);

      signature = await this.solanaService.sendLamports(
        secretKey,
        data.recipient_pubkey,
        data.amount_lamports
      );
    } catch (error: any) {
      // 5. Update to FAILED on error
      await this.transactionRepository.updateStatusAndSignature(transaction.id, null as any, 'FAILED');
      throw new Error(`Solana transaction failed: ${error.message}`);
    }

    // 6. Update to CONFIRMED
    const confirmedTx = await this.transactionRepository.updateStatusAndSignature(
      transaction.id,
      signature,
      'CONFIRMED'
    );

    return confirmedTx;
  }

  private async recordBlockedTransaction(data: CreateTransactionInput, reason: string) {
    try {
      await this.transactionRepository.createTransaction({
        agent_id: data.agent_id,
        idempotency_key: data.idempotency_key,
        request_hash: data.request_hash,
        recipient_pubkey: data.recipient_pubkey,
        amount_lamports: data.amount_lamports,
        decision: 'BLOCKED',
        settlement_status: 'NOT_SUBMITTED',
        purpose: data.purpose,
        error_code: reason,
      });
    } catch (err) {
      // Ignore if idempotency key already exists for blocked tx
    }
  }
}
