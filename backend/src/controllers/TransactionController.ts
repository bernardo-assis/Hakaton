import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { TransactionService } from "../services/transactionService";
import { createTransactionSchema } from "../validators/transaction.schema";

export class TransactionController extends BaseController {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(501).json({
        success: false,
        error:
          "Real transfers require authenticated authorization and safe settlement. Use simulator for policy checks.",
      });
      return;
    }
    try {
      const data = createTransactionSchema.parse(req.body);
      const transaction = await this.transactionService.processTransaction(data, req.identity);
      this.handleSuccess(res, transaction);
    } catch (error: any) {
      this.handleError(error, res, 'createTransaction');
    }
  }
}
