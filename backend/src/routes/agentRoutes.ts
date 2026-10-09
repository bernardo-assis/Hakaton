import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { AgentService } from '../services/agentService';
import { AgentRepository } from '../repositories/AgentRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const agentController = new AgentController(new AgentService(new AgentRepository()));

router.get('/', asyncErrorWrapper((req, res) => agentController.listAgents(req, res)));
router.post('/', asyncErrorWrapper((req, res) => agentController.createAgent(req, res)));

export default router;
