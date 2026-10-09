import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { TransactionService } from '../services/transactionService';
import { createTransactionSchema } from '../validators/transaction.schema';

export class TransactionController extends BaseController {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const data = createTransactionSchema.parse(req.body);

      // Process transaction
      const transaction = await this.transactionService.processTransaction(data);

      this.handleSuccess(res, transaction, 201);
    } catch (error: any) {
      if (error.code === '23505') { // Postgres unique violation
        res.status(409).json({ success: false, error: 'Duplicate idempotency key' });
      } else if (error.message && error.message.includes('Solana transaction failed')) {
        console.error('[createTransaction] Solana Error:', error);
        res.status(502).json({ success: false, error: 'A transação falhou na rede Solana. Tente novamente.' });
      } else if (['Agent not found', 'Agent is not active', 'Single transaction cap exceeded', 'Daily transaction cap exceeded'].includes(error.message)) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        this.handleError(error, res, 'createTransaction');
      }
    }
  }
}
