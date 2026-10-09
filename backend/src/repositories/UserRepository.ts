import { query } from '../db/database';

export class UserRepository {
  async createUser(email: string, passwordHash: string, companyName?: string) {
    const res = await query(
      `INSERT INTO users (email, password_hash, company_name) 
       VALUES ($1, $2, $3) RETURNING id, email, company_name, created_at`,
      [email, passwordHash, companyName]
    );
    return res.rows[0];
  }
}
