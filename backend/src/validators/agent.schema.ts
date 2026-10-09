import { z } from 'zod';

export const createAgentSchema = z.object({
  vault_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(200),
  agent_pubkey: z.string().min(32).max(44),
  daily_cap_lamports: z.union([z.number(), z.string(), z.bigint()]),
  single_tx_cap_lamports: z.union([z.number(), z.string(), z.bigint()]).optional(),
  whitelist_enabled: z.boolean().optional()
});
