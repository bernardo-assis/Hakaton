import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { UserService } from '../services/userService';
import { createUserSchema } from '../validators/user.schema';

export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const input = createUserSchema.parse(req.body);
      // Simulating hash
      const password_hash = input.password + '_hash';
      const user = await this.userService.createUser({ ...input, password_hash });
      this.handleSuccess(res, user, 201);
    } catch (error) {
      this.handleError(error, res, 'createUser');
    }
  }
}
