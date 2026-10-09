import { VaultRepository } from '../repositories/VaultRepository';

export class VaultService {
  constructor(private readonly vaultRepository: VaultRepository) {}

  async createVault(data: { user_id: string; owner_pubkey: string; vault_pubkey: string; key_reference: string }) {
    return await this.vaultRepository.createVault(data.user_id, data.owner_pubkey, data.vault_pubkey, data.key_reference);
  }
}
