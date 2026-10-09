import { z } from 'zod';

export const createVaultSchema = z.object({
  user_id: z.string().uuid(),
  owner_pubkey: z.string().min(32).max(44),
  vault_pubkey: z.string().min(32).max(44),
  key_reference: z.string()
});
