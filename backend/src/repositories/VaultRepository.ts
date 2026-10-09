import { query } from '../db/database';

export class VaultRepository {
  async createVault(userId: string, ownerPubkey: string, vaultPubkey: string, keyReference: string) {
    const res = await query(
      `INSERT INTO vaults (user_id, owner_pubkey, vault_pubkey, key_reference) 
       VALUES ($1, $2, $3, $4) RETURNING id, user_id, owner_pubkey, vault_pubkey, status, created_at`,
      [userId, ownerPubkey, vaultPubkey, keyReference]
    );
    return res.rows[0];
  }
}
