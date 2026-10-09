import { Router } from 'express';
import { VaultController } from '../controllers/VaultController';
import { VaultService } from '../services/vaultService';
import { VaultRepository } from '../repositories/VaultRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const vaultController = new VaultController(new VaultService(new VaultRepository()));

router.post('/', asyncErrorWrapper((req, res) => vaultController.createVault(req, res)));

export default router;
