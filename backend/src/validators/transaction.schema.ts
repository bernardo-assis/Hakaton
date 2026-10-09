import { z } from 'zod';

export const createTransactionSchema = z.object({
  agent_id: z.string().uuid(),
  idempotency_key: z.string().min(1),
  request_hash: z.string().min(1),
  recipient_pubkey: z.string().min(32).max(44),
  amount_lamports: z.number().int().positive(),
  purpose: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
