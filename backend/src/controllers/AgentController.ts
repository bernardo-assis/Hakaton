import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AgentService } from '../services/agentService';
import { createAgentSchema } from '../validators/agent.schema';

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

  async createAgent(req: Request, res: Response): Promise<void> {
    try {
      const parsedData = createAgentSchema.parse(req.body);
      const agent = await this.agentService.createAgent({
        vault_id: parsedData.vault_id,
        name: parsedData.name,
        role: parsedData.role,
        agent_pubkey: parsedData.agent_pubkey,
        daily_cap_lamports: parsedData.daily_cap_lamports,
        single_tx_cap_lamports: parsedData.single_tx_cap_lamports ?? parsedData.daily_cap_lamports,
        whitelist_enabled: parsedData.whitelist_enabled
      });
      this.handleSuccess(res, agent, 201);
    } catch (error) {
      this.handleError(error, res, 'createAgent');
    }
  }
}
