const fs = require('fs');
const path = require('path');

const dirs = [
  'src/config',
  'src/controllers',
  'src/services',
  'src/repositories',
  'src/routes',
  'src/utils',
  'src/validators'
];

dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

const files = {
  'src/config/unifiedConfig.ts': `import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3001,
  },
  db: {
    url: process.env.DATABASE_URL,
  }
};
`,
  'src/utils/asyncErrorWrapper.ts': `import { Request, Response, NextFunction } from 'express';

export const asyncErrorWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
`,
  'src/controllers/BaseController.ts': `import { Response } from 'express';

export class BaseController {
  protected handleSuccess(res: Response, data: any, statusCode = 200): void {
    res.status(statusCode).json({ success: true, data });
  }

  protected handleError(error: any, res: Response, context: string): void {
    // Sentry.captureException(error); // Placeholder for Sentry
    console.error(\`[\${context}] Error:\`, error);
    if (error.name === 'ZodError') {
      res.status(400).json({ success: false, error: 'Validation Error', details: error.errors });
      return;
    }
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
`,
  'src/validators/user.schema.ts': `import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  company_name: z.string().optional()
});
`,
  'src/validators/vault.schema.ts': `import { z } from 'zod';

export const createVaultSchema = z.object({
  user_id: z.string().uuid(),
  owner_pubkey: z.string().length(44),
  vault_pubkey: z.string().length(44),
  key_reference: z.string()
});
`,
  'src/repositories/UserRepository.ts': `import { query } from '../db/database';

export class UserRepository {
  async createUser(email: string, passwordHash: string, companyName?: string) {
    const res = await query(
      \`INSERT INTO users (email, password_hash, company_name) 
       VALUES ($1, $2, $3) RETURNING id, email, company_name, created_at\`,
      [email, passwordHash, companyName]
    );
    return res.rows[0];
  }
}
`,
  'src/services/userService.ts': `import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(data: { email: string; password_hash: string; company_name?: string }) {
    // Ideally we would hash the password here, but ignoring for brevity in boilerplate
    return await this.userRepository.createUser(data.email, data.password_hash, data.company_name);
  }
}
`,
  'src/controllers/UserController.ts': `import { Request, Response } from 'express';
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
`,
  'src/routes/userRoutes.ts': `import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/UserRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const userController = new UserController(new UserService(new UserRepository()));

router.post('/', asyncErrorWrapper((req, res) => userController.createUser(req, res)));

export default router;
`,
  'src/repositories/VaultRepository.ts': `import { query } from '../db/database';

export class VaultRepository {
  async createVault(userId: string, ownerPubkey: string, vaultPubkey: string, keyReference: string) {
    const res = await query(
      \`INSERT INTO vaults (user_id, owner_pubkey, vault_pubkey, key_reference) 
       VALUES ($1, $2, $3, $4) RETURNING id, user_id, owner_pubkey, vault_pubkey, status, created_at\`,
      [userId, ownerPubkey, vaultPubkey, keyReference]
    );
    return res.rows[0];
  }
}
`,
  'src/services/vaultService.ts': `import { VaultRepository } from '../repositories/VaultRepository';

export class VaultService {
  constructor(private readonly vaultRepository: VaultRepository) {}

  async createVault(data: { user_id: string; owner_pubkey: string; vault_pubkey: string; key_reference: string }) {
    return await this.vaultRepository.createVault(data.user_id, data.owner_pubkey, data.vault_pubkey, data.key_reference);
  }
}
`,
  'src/controllers/VaultController.ts': `import { Request, Response } from 'express';
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
`,
  'src/routes/vaultRoutes.ts': `import { Router } from 'express';
import { VaultController } from '../controllers/VaultController';
import { VaultService } from '../services/vaultService';
import { VaultRepository } from '../repositories/VaultRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const vaultController = new VaultController(new VaultService(new VaultRepository()));

router.post('/', asyncErrorWrapper((req, res) => vaultController.createVault(req, res)));

export default router;
`,
  'src/repositories/AgentRepository.ts': `import { query } from '../db/database';

export class AgentRepository {
  async listAgents() {
    // In production we would filter by vault_id or user_id
    const res = await query(
      \`SELECT id, vault_id, name, role, agent_pubkey, status, daily_cap_lamports, single_tx_cap_lamports, whitelist_enabled, created_at FROM agents\`
    );
    return res.rows;
  }
}
`,
  'src/services/agentService.ts': `import { AgentRepository } from '../repositories/AgentRepository';

export class AgentService {
  constructor(private readonly agentRepository: AgentRepository) {}

  async listAgents() {
    return await this.agentRepository.listAgents();
  }
}
`,
  'src/controllers/AgentController.ts': `import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AgentService } from '../services/agentService';

export class AgentController extends BaseController {
  constructor(private readonly agentService: AgentService) {
    super();
  }

  async listAgents(req: Request, res: Response): Promise<void> {
    try {
      const agents = await this.agentService.listAgents();
      // Converter BigInt para string (se houver) para serialização JSON funcionar, embora o pg retorne int8 como string por padrão
      this.handleSuccess(res, agents);
    } catch (error) {
      this.handleError(error, res, 'listAgents');
    }
  }
}
`,
  'src/routes/agentRoutes.ts': `import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { AgentService } from '../services/agentService';
import { AgentRepository } from '../repositories/AgentRepository';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();
const agentController = new AgentController(new AgentService(new AgentRepository()));

router.get('/', asyncErrorWrapper((req, res) => agentController.listAgents(req, res)));

export default router;
`,
  'src/app.ts': `import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import vaultRoutes from './routes/vaultRoutes';
import agentRoutes from './routes/agentRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/vaults', vaultRoutes);
app.use('/api/agents', agentRoutes);

export default app;
`,
  'src/server.ts': `import app from './app';
import { config } from './config/unifiedConfig';
import './db/database'; // Ensures DB connects on startup

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(\`🚀 [Server] Running at http://localhost:\${PORT}\`);
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(__dirname, filepath), content);
  console.log('Created:', filepath);
}
