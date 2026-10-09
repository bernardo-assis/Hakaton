import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const dashboardController = new DashboardController();

router.get('/', asyncErrorWrapper((req, res) => dashboardController.getDashboardStats(req, res)));
router.post('/deposit', asyncErrorWrapper((req, res) => dashboardController.deposit(req, res)));

export default router;
