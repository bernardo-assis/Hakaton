import { Request, Response } from "express";
import { BaseController } from "./BaseController";
import { TransactionService } from "../services/transactionService";
import { createTransactionSchema } from "../validators/transaction.schema";

export class TransactionController extends BaseController {
  constructor(private readonly transactionService: TransactionService) {
    super();
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    res
      .status(501)
      .json({
        success: false,
        error:
          "Real transfers require authenticated authorization and safe settlement. Use simulator for policy checks.",
      });
  }
}
