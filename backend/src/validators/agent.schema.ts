import { z } from "zod";
import { moneySchema, pubkeySchema, idSchema } from "./ui.schema";
export const createAgentSchema = z
  .object({
    vault_id: idSchema,
    name: z.string().trim().min(1).max(100),
    role: z.string().trim().min(1).max(200),
    agent_pubkey: pubkeySchema,
    daily_cap_lamports: moneySchema,
    single_tx_cap_lamports: moneySchema.optional(),
    whitelist_enabled: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      BigInt(v.single_tx_cap_lamports ?? v.daily_cap_lamports) <=
      BigInt(v.daily_cap_lamports),
    "Single cap exceeds daily cap",
  );
