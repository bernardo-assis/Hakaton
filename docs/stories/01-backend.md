# Story 01: Backend Core, Database & Solana Devnet Settlement

**Épico:** Infraestrutura de Cofres & Motor de Políticas de Segurança (AgentSafe)
**Fase:** Fase 2 · Orquestração e Execução (Backend)
**Responsáveis:** `@sm` (Coordenação), `@dev-back` (Implementação), `@qa` (Auditoria & Testes)
**Status:** Modelagem SQL validada; serviços e conexão ainda pendentes

---

## 1. Contexto & Objetivo
Implementar a fundação do **AgentSafe** no backend em Node.js com Express, TypeScript, SQLite (`better-sqlite3`), validações Zod e `@solana/web3.js` conectado à Solana Devnet. O backend deve ser capaz de receber requisições de pagamento de agentes de IA, avaliar estritamente as regras `RN01` a `RN05`, executar transferências reais na Devnet para pagamentos válidos, e rejeitar/registrar abusos e limites estourados.

---

## 2. Checklist de Execução Técnica

### Camada 1: Setup do Ambiente & Banco de Dados (SQLite)
- [ ] **Configuração do Projeto Backend:** Inicializar `backend/package.json`, `tsconfig.json` e instalar dependências (`express`, `cors`, `dotenv`, `zod`, `better-sqlite3`, `@solana/web3.js`, `ts-node-dev`, `@types/...`).
- [x] **Schema SQL:** Criar e validar `src/db/schema.sql` conforme `docs/architecture/DATABASE.md`, incluindo `audit_events` e `agent_credentials`.
- [ ] **Conexão SQLite:** Implementar `src/db/database.ts`, habilitar foreign keys em cada conexão e carregar o schema; não tratar o schema inicial como migração de um banco antigo.
- [ ] **Seed Inicial:** Script para popular 1 cofre mestre de teste e 2 agentes com tetos distintos (um para testes válidos e outro para testes de bloqueio).

### Camada 2: Conexão Web3 Solana (Devnet)
- [ ] **Configuração Solana (`src/config/solana.ts`):** Estabelecer conexão com cluster RPC `https://api.devnet.solana.com`.
- [ ] **Serviço Solana (`src/services/solanaService.ts`):** Implementar geração de Keypair do cofre, consulta de saldo, verificação de airdrop e função `transferSolDevnet(toPublicKey, amountLamports)` retornando a assinatura da transação e URL do Solana Explorer.

### Camada 3: Motor de Políticas (Policy Engine)
- [ ] **Implementação das Regras (`src/services/policyEngine.ts`):**
  - [ ] `RN01`: Checagem de status (`ACTIVE` vs `FROZEN`).
  - [ ] `RN04`: Validação de Whitelist (se ativa).
  - [ ] `RN02`: Validação de Teto por Transação (`single_tx_cap_lamports`).
  - [ ] `RN03`: Validação de Teto Diário acumulado nas últimas 24h (`daily_cap_lamports`).
  - [ ] Reserva atômica de orçamento e saldo compartilhado, incluindo taxa, conforme DATABASE.md.
  - [ ] Idempotência por agente, comparação do conteúdo e recuperação da mesma solicitação.
  - [ ] Persistência antes do envio, conciliação de CONFIRMED/FAILED/UNKNOWN e recuperação após reinício.
  - [ ] Congelamento global e individual, coordenado com o envio.

### Camada 4: Rotas & Controllers Express (Porta 3001)
- [ ] **Autenticação e autorização:** Gestor por desafio assinado com expiração/uso único e sessão revogável; agente por token opaco com hash, validade e revogação. Definir armazenamento de sessão antes de implementar.
- [ ] **Administração:** Cadastro/alteração de agentes, whitelist e credenciais, com auditoria na mesma transação da mudança.
- [ ] **Schemas Zod (`src/schemas/vault.schemas.ts`):** Validação estrita dos bodies de requisição.
- [ ] **Endpoints REST (`src/routes/vaultRoutes.ts` & `src/controllers/vaultController.ts`):**
  - [ ] `POST /api/v1/vault/pay`: Processa tentativa de pagamento da IA.
  - [ ] `POST /api/v1/vault/panic`: Kill Switch para agente ou cofre, com autorização do proprietário.
  - [ ] `GET /api/v1/vault/telemetry`: Retorna métricas, agentes e histórico de transações.
  - [ ] `GET /api/v1/vault/health`: Healthcheck da API e da conexão Solana.

### Camada 5: Testes Automatizados & Auditoria (@qa)
- [ ] **Script de Teste E2E (`test-vault.ts`):** Executar bateria de 5 testes reais:
  1. Pagamento válido (10000000 lamports) -> Deve iniciar com decisão APPROVED/estado RESERVED e chegar a CONFIRMED com assinatura verificada na Solana Devnet.
  2. Tentativa de estourar teto por transação (ex: 2.0 SOL) -> Deve retornar status `BLOCKED` com código `ERR_EXCEEDS_SINGLE_TX_LIMIT`.
  3. Tentativa de estourar teto diário acumulado -> Deve retornar `ERR_EXCEEDS_DAILY_BUDGET`.
  4. Acionamento do Kill Switch (`/panic`) -> Agente fica `FROZEN`.
  5. Tentativa de pagamento com agente congelado -> Deve retornar `ERR_AGENT_FROZEN`.
- [ ] **Auditoria de Qualidade:** `@qa` valida contratos de API, integridade de tipos e ausência de vazamento de chaves privadas.

### Validação da modelagem e cenários adicionais
- [x] Executar `python3 -m unittest discover -s backend/tests -p "test_schema.py" -v` — 8 testes aprovados em 2026-10-08.
- [ ] Testar duplicação, concorrência, falhas de rede e reinício na implementação real.
- [ ] Testar isolamento entre proprietários, credenciais expiradas/revogadas e congelamento global.
- [ ] Seguir `docs/architecture/DATABASE_MANUAL_TEST.md`; testes de schema não aprovam a API nem o settlement.
