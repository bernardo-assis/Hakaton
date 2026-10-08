# ARCHITECTURE.md — AgentSafe (Solana Agentic Vault)

**Versão:** 2.0 (Decoupled: React Vite + Node.js Express)  
**Data:** 08 de Outubro de 2026  
**Status:** Aprovado (Fase 1 - Concluída)  
**Autor:** @architect (O Guardião)  
**Projeto:** AgentSafe — Autonomous AI Agent Budget & Security Vault  
**Hackathon Track:** Colosseum / Crypto World's Fair — Solana Agentic Payments  

---

## 1. Visão Geral da Arquitetura & Diretrizes Sagradas

O **AgentSafe** adota a arquitetura desacoplada **Frontend SPA + Backend REST API Dedicada**:

1. **Frontend (Presentation Layer):** **React (Vite) + TypeScript + Tailwind CSS (v3.4) + Lucide Icons + Solana Wallet Adapter**. Interface rápida, reativa, sem overhead de servidor SSR e com suporte nativo à carteira Phantom.
2. **Backend API & Policy Interceptor (Security / Core Layer):** **Node.js + Express + TypeScript + Zod**. Isola completamente a chave de custódia do cofre e as regras de segurança contra alucinações e prompt injections. Avalia as políticas em < 20ms.
3. **Onchain Settlement (Web3 Layer):** **Solana Devnet** via `@solana/web3.js` nativo no Node.js (eliminando polyfills de browser/Webpack).
4. **Data Layer (Persistência):** **SQLite (via Better-SQLite3)** para latência ultrabaixa (< 3ms) em consultas locais de teto diário e histórico de auditoria.

> 🛡️ **Diretriz Sagrada de Segurança:** A IA autônoma e o frontend no navegador NUNCA têm acesso à chave privada do cofre. Apenas o servidor Express assina transações aprovadas pelas políticas.

---

## 2. Topologia do Sistema (Mermaid)

```mermaid
graph TD
    subgraph "Frontend: React (Vite)"
        User[Usuário Humano / Gestor]
        Phantom[Phantom Wallet - Solana Devnet]
        Dashboard[AgentSafe Dashboard / Pitch Simulator]
    end

    subgraph "Backend: Node.js + Express (Porta 3001)"
        API[Express Router / API Gateway]
        RateLimit[Express Rate Limit & CORS]
        Zod[Zod Schema Validator]
        PolicyEngine[Motor de Políticas (RN01 - RN05)]
        KillSwitchMgr[Gerenciador de Kill Switch]
        SolanaService[Solana Service (@solana/web3.js)]
    end

    subgraph "Agentes de IA (Clientes Externos)"
        AIAgent[Agente de IA / Script Python / n8n]
    end

    subgraph "Persistência Local (SQLite)"
        DB[(database.sqlite)]
        VaultTable[Tabela: Vaults]
        AgentTable[Tabela: Agentes & Tetos]
        TxTable[Tabela: Auditoria & Telemetria]
    end

    subgraph "Rede Solana (Devnet)"
        DevnetCluster[Cluster RPC: api.devnet.solana.com]
        Explorer[Solana Explorer Devnet]
        ServiceVendor[Prestador de Serviço da IA]
    end

    User -->|Conecta Carteira / Configura Limites| Dashboard
    Dashboard -->|REST API fetch| API
    AIAgent -->|POST /api/v1/vault/pay| API
    
    API --> RateLimit
    RateLimit --> Zod
    Zod --> PolicyEngine
    PolicyEngine -->|Valida Tetos e Status| DB

    PolicyEngine -- Rejeitado (Abuso/Excesso) --> TxTable
    TxTable -->|Alerta Visual Imediato no Front| Dashboard

    PolicyEngine -- Aprovado --> SolanaService
    SolanaService -->|Assina e Envia Tx| DevnetCluster
    DevnetCluster -->|Transfere SOL| ServiceVendor
    DevnetCluster -->|Retorna Tx Hash| TxTable
    TxTable -->|Extrato Auditável com Link Onchain| Dashboard
    Explorer -.->|Validação Pública da Assinatura| DevnetCluster
```

---

## 3. Matriz da Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa Técnica |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React (Vite)** | 18 / 19 | Inicialização instantânea com HMR, zero conflitos de compilação Web3, build leve e performático. |
| **Estilização** | **Tailwind CSS** | v3.4.x | Design system ágil em Dark Mode fintech, sem dependências pesadas de UI. |
| **Web3 Client** | **@solana/wallet-adapter** | Latest | Integração padrão e fluida para conexão de carteira Phantom no navegador. |
| **Backend Runtime** | **Node.js + Express** | v20+ / 4.x | Servidor dedicado, leve, estável e modular com arquitetura de rotas, controllers e services. |
| **Tipagem** | **TypeScript** | 5.x | Tipagem estrita compartilhada nos modelos de requisição e resposta. |
| **Web3 Engine (Backend)** | **@solana/web3.js** | v1.95+ | Comunicação direta com a Solana Devnet, geração de keypairs e assinaturas de transações de transferência. |
| **Validação** | **Zod** | v3.23+ | Validação estrita de todos os corpos de requisição (`req.body`) impedindo campos inválidos. |
| **Banco de Dados** | **SQLite (Better-SQLite3)** | v11+ | Banco embarcado em arquivo local, síncrono e veloz (< 3ms) ideal para hackathons e demonstrações. |

---

## 4. Estrutura de Diretórios do Projeto

```text
agentsafe/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── solana.ts          # Configuração de RPC Devnet e Keypairs
│   │   ├── db/
│   │   │   ├── schema.sql         # Criação das tabelas
│   │   │   └── database.ts        # Conexão SQLite (Better-SQLite3)
│   │   ├── schemas/
│   │   │   └── vault.schemas.ts   # Schemas Zod para requests
│   │   ├── services/
│   │   │   ├── policyEngine.ts    # Validação síncrona de RN01 a RN05
│   │   │   └── solanaService.ts   # Execução real na Solana Devnet
│   │   ├── controllers/
│   │   │   └── vaultController.ts # Handlers REST
│   │   ├── routes/
│   │   │   └── vaultRoutes.ts     # Rotas /api/v1/vault/*
│   │   └── server.ts              # Inicialização Express + CORS + Middlewares
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Conexão Phantom Wallet e status da rede
│   │   │   ├── VaultOverview.tsx  # Saldo total, limites e métricas
│   │   │   ├── AgentCard.tsx      # Cards dos agentes com limites e Kill Switch
│   │   │   ├── PitchSimulator.tsx # Painel de simulação rápida para a banca (1 clique)
│   │   │   └── AuditTable.tsx     # Extrato em tempo real (Aprovado / Bloqueado)
│   │   ├── services/
│   │   │   └── api.ts             # Cliente HTTP para o Backend Express (porta 3001)
│   │   ├── App.tsx                # Layout principal do Dashboard
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── docs/
    ├── prd.md                     # Requisitos e Casos de Uso
    ├── architecture/
    │   └── ARCHITECTURE.md        # Este documento
    └── stories/                   # Histórias de desenvolvimento da Fase 2
```

---

## 5. Modelagem de Dados (`database.sqlite`)

```sql
-- 1. Tabela de Cofres Mestres
CREATE TABLE IF NOT EXISTS vaults (
    id TEXT PRIMARY KEY,
    owner_pubkey TEXT NOT NULL,
    vault_pubkey TEXT NOT NULL,
    vault_secret_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Agentes de IA Cadastrados
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    vault_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    agent_pubkey TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('ACTIVE', 'FROZEN')),
    daily_cap_sol REAL NOT NULL,
    single_tx_cap_sol REAL NOT NULL,
    whitelist_enabled INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vault_id) REFERENCES vaults(id)
);

-- 3. Tabela de Whitelist de Prestadores
CREATE TABLE IF NOT EXISTS whitelist_recipients (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    recipient_pubkey TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

-- 4. Extrato de Auditoria & Telemetria
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    recipient_pubkey TEXT NOT NULL,
    amount_sol REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('APPROVED', 'BLOCKED')),
    error_code TEXT,
    error_message TEXT,
    solana_signature TEXT,
    explorer_url TEXT,
    purpose TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);
```

---

## 6. Motor de Políticas (Policy Engine: RN01 a RN05)

O serviço `policyEngine.ts` opera de forma atômica no backend antes de qualquer chamada RPC:

1. **[RN01 - Status]:** Se `agent.status !== 'ACTIVE'`, aborta com `ERR_AGENT_FROZEN`.
2. **[RN04 - Whitelist]:** Se `agent.whitelist_enabled == 1` e `recipient` não estiver na lista permitida, aborta com `ERR_UNAUTHORIZED_RECIPIENT`.
3. **[RN02 - Teto por Transação]:** Se `amount_sol > agent.single_tx_cap_sol`, aborta com `ERR_EXCEEDS_SINGLE_TX_LIMIT`.
4. **[RN03 - Teto Diário 24h]:** Calcula soma de `amount_sol` aprovados nas últimas 24 horas. Se `gasto24h + amount_sol > agent.daily_cap_sol`, aborta com `ERR_EXCEEDS_DAILY_BUDGET`.
5. **[Saldo do Cofre]:** Consulta saldo na Solana Devnet. Se insuficiente, aborta com `ERR_INSUFFICIENT_VAULT_BALANCE`.
6. **[RN05 - Execução Onchain]:** Dispara transferência na Solana Devnet, extrai a assinatura e grava status `APPROVED`.

---

## 7. Contratos de API REST (Express - Porta 3001)

### `POST /api/v1/vault/pay`
Consumido pelos scripts das IAs ou pelo Simulador.
* **Payload:** `{ "agentId": "string", "recipient": "string", "amountSol": number, "purpose": "string" }`
* **Retorno Aprovado (200):** `{ "success": true, "status": "APPROVED", "solanaSignature": "...", "explorerUrl": "..." }`
* **Retorno Bloqueado (422/403):** `{ "success": false, "status": "BLOCKED", "errorCode": "...", "errorMessage": "..." }`

### `POST /api/v1/vault/panic`
Kill switch de congelamento instantâneo.
* **Payload:** `{ "agentId": "string", "action": "FREEZE" | "UNFREEZE" }`
* **Retorno (200):** `{ "success": true, "agentId": "...", "status": "FROZEN" }`

### `GET /api/v1/vault/telemetry`
Extrato completo consumido pelo Dashboard React.
* **Retorno (200):** `{ "vaultBalanceSol": number, "agents": [...], "transactions": [...] }`

---

## 8. Ordem Estrita de Execução (Regra do Time)

1. **Passo 1 (Backend Completo):**
   * Configuração do projeto `backend/` com Node.js, Express, TypeScript, SQLite e Solana Devnet.
   * Validação de testes via script (transação aprovada vs bloqueada com hashes reais).
2. **Passo 2 (Frontend React Vite):**
   * Configuração do projeto `frontend/` com Tailwind CSS e Solana Wallet Adapter.
   * Criação do Dashboard, Cards dos Agentes e Extrato de Telemetria.
3. **Passo 3 (Pitch Simulator & Polish):**
   * Painel de simulação interativa de 3 minutos para a banca avaliadora.
