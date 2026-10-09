import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: { email: string; password_hash: string; company_name?: string }) {
    // Ideally we would hash the password here, but ignoring for brevity in boilerplate
    return await this.userRepository.createUser(data.email, data.password_hash, data.company_name);
  }
}
