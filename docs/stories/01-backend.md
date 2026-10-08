# Story 01: Backend Core, Database & Solana Devnet Settlement

**Épico:** Infraestrutura de Cofres & Motor de Políticas de Segurança (AgentSafe)  
**Fase:** Fase 2 · Orquestração e Execução (Backend)  
**Responsáveis:** `@sm` (Coordenação), `@dev-back` (Implementação), `@qa` (Auditoria & Testes)  
**Status:** Pronto para Iniciar  

---

## 1. Contexto & Objetivo
Implementar a fundação do **AgentSafe** no backend em Node.js com Express, TypeScript, SQLite (`better-sqlite3`), validações Zod e `@solana/web3.js` conectado à Solana Devnet. O backend deve ser capaz de receber requisições de pagamento de agentes de IA, avaliar estritamente as regras `RN01` a `RN05`, executar transferências reais na Devnet para pagamentos válidos, e rejeitar/registrar abusos e limites estourados.

---

## 2. Checklist de Execução Técnica

### Camada 1: Setup do Ambiente & Banco de Dados (SQLite)
- [ ] **Configuração do Projeto Backend:** Inicializar `backend/package.json`, `tsconfig.json` e instalar dependências (`express`, `cors`, `dotenv`, `zod`, `better-sqlite3`, `@solana/web3.js`, `ts-node-dev`, `@types/...`).
- [ ] **Schema e Conexão com SQLite:** Criar `src/db/schema.sql` e `src/db/database.ts` criando as tabelas `vaults`, `agents`, `whitelist_recipients` e `transactions`.
- [ ] **Seed Inicial:** Script para popular 1 cofre mestre de teste e 2 agentes com tetos distintos (um para testes válidos e outro para testes de bloqueio).

### Camada 2: Conexão Web3 Solana (Devnet)
- [ ] **Configuração Solana (`src/config/solana.ts`):** Estabelecer conexão com cluster RPC `https://api.devnet.solana.com`.
- [ ] **Serviço Solana (`src/services/solanaService.ts`):** Implementar geração de Keypair do cofre, consulta de saldo, verificação de airdrop e função `transferSolDevnet(toPublicKey, amountSol)` retornando a assinatura da transação e URL do Solana Explorer.

### Camada 3: Motor de Políticas (Policy Engine)
- [ ] **Implementação das Regras (`src/services/policyEngine.ts`):**
  - [ ] `RN01`: Checagem de status (`ACTIVE` vs `FROZEN`).
  - [ ] `RN04`: Validação de Whitelist (se ativa).
  - [ ] `RN02`: Validação de Teto por Transação (`single_tx_cap_sol`).
  - [ ] `RN03`: Validação de Teto Diário acumulado nas últimas 24h (`daily_cap_sol`).
  - [ ] Checagem de Saldo disponível no cofre.

### Camada 4: Rotas & Controllers Express (Porta 3001)
- [ ] **Schemas Zod (`src/schemas/vault.schemas.ts`):** Validação estrita dos bodies de requisição.
- [ ] **Endpoints REST (`src/routes/vaultRoutes.ts` & `src/controllers/vaultController.ts`):**
  - [ ] `POST /api/v1/vault/pay`: Processa tentativa de pagamento da IA.
  - [ ] `POST /api/v1/vault/panic`: Kill Switch instantâneo para congelar agente.
  - [ ] `GET /api/v1/vault/telemetry`: Retorna métricas, agentes e histórico de transações.
  - [ ] `GET /api/v1/vault/health`: Healthcheck da API e da conexão Solana.

### Camada 5: Testes Automatizados & Auditoria (@qa)
- [ ] **Script de Teste E2E (`test-vault.ts`):** Executar bateria de 5 testes reais:
  1. Pagamento válido (0.01 SOL) -> Deve retornar status `APPROVED` e hash na Solana Devnet.
  2. Tentativa de estourar teto por transação (ex: 2.0 SOL) -> Deve retornar status `BLOCKED` com código `ERR_EXCEEDS_SINGLE_TX_LIMIT`.
  3. Tentativa de estourar teto diário acumulado -> Deve retornar `ERR_EXCEEDS_DAILY_BUDGET`.
  4. Acionamento do Kill Switch (`/panic`) -> Agente fica `FROZEN`.
  5. Tentativa de pagamento com agente congelado -> Deve retornar `ERR_AGENT_FROZEN`.
- [ ] **Auditoria de Qualidade:** `@qa` valida contratos de API, integridade de tipos e ausência de vazamento de chaves privadas.
