import { Router } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../services/transactionService';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { AgentRepository } from '../repositories/AgentRepository';
import { SolanaService } from '../services/solanaService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();

// Dependency Injection
const transactionRepository = new TransactionRepository();
const agentRepository = new AgentRepository();
const solanaService = new SolanaService();
const transactionService = new TransactionService(transactionRepository, agentRepository, solanaService);
const transactionController = new TransactionController(transactionService);

router.post(
  '/',
  asyncErrorWrapper((req, res) => transactionController.createTransaction(req, res))
);

export default router;
