import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { VaultService } from '../services/vaultService';
import { createVaultSchema } from '../validators/vault.schema';

export class VaultController extends BaseController {
  constructor(private readonly vaultService: VaultService) {
    super();
  }

  async createVault(req: Request, res: Response): Promise<void> {
    try {
      const input = createVaultSchema.parse(req.body);
      const vault = await this.vaultService.createVault(input);
      this.handleSuccess(res, vault, 201);
    } catch (error) {
      this.handleError(error, res, 'createVault');
    }
  }
}
