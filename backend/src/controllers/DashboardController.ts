import { Request, Response } from "express";
import { z } from "zod";
import { BaseController } from "./BaseController";
import { UiRepository } from "../repositories/UiRepository";
import { UiService } from "../services/uiService";
import { config } from "../config/unifiedConfig";
export class DashboardController extends BaseController {
  constructor() {
    super();
  }
  async deposit(req: Request, res: Response) {
    try {
      const input = z
        .object({
          vault_id: z.string().uuid().optional(),
          amountSol: z
            .number()
            .positive()
            .max(2)
            .refine(
              (v) => Number.isSafeInteger(v * 1e9),
              "Amount must represent integer lamports",
            ),
        })
        .strict()
        .parse(req.body);
      if (new URL(config.solana.rpcUrl).hostname !== "api.devnet.solana.com")
        throw Object.assign(
          new Error("Faucet is only available on official Solana Devnet"),
          { status: 400 },
        );
      this.handleSuccess(
        res,
        await new UiService(new UiRepository(req.identity!)).deposit(
          input.vault_id,
          input.amountSol,
        ),
      );
    } catch (e) {
      this.handleError(e, res, "deposit");
    }
  }
}
