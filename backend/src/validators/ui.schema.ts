import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
export const idSchema = z.string().uuid();
export const moneySchema = z
  .union([
    z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    z.string().max(16).regex(/^\d+$/),
  ])
  .transform(String)
  .refine(
    (v) => BigInt(v) <= BigInt(Number.MAX_SAFE_INTEGER),
    "Unsafe monetary amount",
  );
export const pubkeySchema = z.string().refine((v) => {
  try {
    return new PublicKey(v).toBase58() === v;
  } catch {
    return false;
  }
}, "Invalid Solana public key");
export const editAgentSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    role: z.string().trim().min(1).max(200).optional(),
    daily_cap_lamports: moneySchema.optional(),
    single_tx_cap_lamports: moneySchema.optional(),
    status: z.enum(["ACTIVE", "FROZEN"]).optional(),
    whitelist_enabled: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export const policiesSchema = z
  .object({
    pause_on_low_balance: z.boolean(),
    low_balance_threshold_lamports: moneySchema,
    require_human_approval: z.boolean(),
    approval_threshold_lamports: moneySchema,
    block_unlisted_recipients: z.boolean(),
  })
  .strict();
export const simulationSchema = z
  .object({
    agent_id: idSchema,
    amount_lamports: moneySchema.refine((v) => BigInt(v) > 0),
    recipient_pubkey: pubkeySchema,
    purpose: z.string().max(500).optional(),
    request_id: z.string().min(1).max(100),
  })
  .strict();
