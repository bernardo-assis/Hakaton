import { z } from 'zod';

export const createTransactionSchema = z
  .object({
    agent_id: z.string().uuid(),
    idempotency_key: z.string().trim().min(1).max(128),
    request_hash: z.string().trim().min(1).max(128),
    recipient_pubkey: z
      .string()
      .trim()
      .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana recipient address"),
    amount_lamports: z
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER, "Amount exceeds safe maximum"),
    purpose: z.string().trim().max(255).optional(),
  })
  .strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
