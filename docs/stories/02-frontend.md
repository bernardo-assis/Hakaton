# Story 02: Frontend Dashboard, Solana Wallet & Pitch Simulator

**Épico:** Interface de Gestão, Monitoramento e Apresentação do Cofre (AgentSafe)  
**Fase:** Fase 2 · Orquestração e Execução (Frontend)  
**Responsáveis:** `@sm` (Coordenação), `@dev-front` (Implementação), `@qa` (Auditoria)  
**Status:** Bloqueado (Aguardando conclusão da Story 01 - Backend)  

---

## 1. Contexto & Objetivo
Criar o dashboard web em React (Vite) + Tailwind CSS + Lucide Icons + Solana Wallet Adapter. O dashboard consome a API pronta do Backend na porta 3001 e fornece ao usuário controle total da frota de agentes, botão de pânico (Kill Switch), extrato de auditoria e o simulador interativo de pitch para a banca da Colosseum / Solana Hackathon.

---

## 2. Checklist de Execução Técnica

### Camada 1: Setup do Projeto & Conexão Web3
- [ ] **Configuração do Projeto Frontend:** Vite + React + TypeScript + Tailwind CSS v3.4.
- [ ] **Integração Phantom Wallet:** Configuração do `@solana/wallet-adapter-react` e botão de conexão de carteira.
- [ ] **Cliente de API (`src/services/api.ts`):** Funções tipadas para consumir `/api/v1/vault/*`.

### Camada 2: Componentes do Dashboard
- [ ] **Navbar & Status da Rede:** Saldo do cofre, status da conexão Solana Devnet e badge da carteira.
- [ ] **Vault Overview:** Cards de métricas com volume transacionado, total bloqueado e agentes ativos.
- [ ] **Agent Cards:** Visualização dos agentes de IA com sliders/badges de limites e botão de Kill Switch (`FREEZE`/`UNFREEZE`).
- [ ] **Extrato de Telemetria (Audit Log):** Tabela em tempo real com status (verde para aprovado com link para o Solana Explorer; vermelho para tentativas bloqueadas com o código de erro).

### Camada 3: Simulador de Pitch (3-Minute Demo)
- [ ] **Painel Interativo de Simulação:**
  - Botão 🟢: "Simular Pagamento Legítimo da IA" (0.01 SOL para API).
  - Botão 🔴: "Simular Injeção de Prompt / Tentativa de Dreno" (tentativa de roubo barrada pelo cofre).
  - Botão ⚡: "Ativar Kill Switch ao Vivo" (congelar o agente na hora).
  - Feedback visual imediato com banner de sucesso/bloqueio e link onchain.
