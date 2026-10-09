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

  async processTransaction(data: CreateTransactionInput) {
    // 1. Fetch agent
    const agent = await this.agentRepository.getAgentById(data.agent_id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'ACTIVE') {
      throw new Error('Agent is not active');
    }

    // 2. Validate caps
    const amount = BigInt(data.amount_lamports);
    if (amount > agent.single_tx_cap_lamports) {
      await this.recordBlockedTransaction(data, 'SINGLE_TX_CAP_EXCEEDED');
      throw new Error('Single transaction cap exceeded');
    }

    const dailySpent = await this.transactionRepository.getDailySpentLamports(data.agent_id);
    if (dailySpent + amount > agent.daily_cap_lamports) {
      await this.recordBlockedTransaction(data, 'DAILY_CAP_EXCEEDED');
      throw new Error('Daily transaction cap exceeded');
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
        settlement_status: 'FAILED',
        purpose: data.purpose,
      });
    } catch (err) {
      // Ignore if idempotency key already exists for blocked tx
    }
  }
}
