import { AgentRepository, CreateAgentDTO } from '../repositories/AgentRepository';

export class AgentService {
  constructor(private readonly agentRepository: AgentRepository) {}

  async listAgents() {
    return await this.agentRepository.listAgents();
  }

  async createAgent(data: CreateAgentDTO) {
    // Aqui podemos adicionar lógicas adicionais, ex: checar se o cofre existe, se o agente já existe
    return await this.agentRepository.createAgent(data);
  }
}
