import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/UserRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const userController = new UserController(new UserService(new UserRepository()));

router.post('/', asyncErrorWrapper((req, res) => userController.createUser(req, res)));

export default router;
