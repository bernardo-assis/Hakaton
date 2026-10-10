# ARCHITECTURE.md — AgentSafe (Solana Agentic Vault)

**Versão:** 2.1 (Revisão de integridade financeira e persistência)
**Data:** 08 de Outubro de 2026
**Status:** Desenho revisado; serviços, autenticação e integração onchain ainda pendentes de implementação e validação
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

O SQL executável é a fonte única em [`backend/src/db/schema.sql`](../../backend/src/db/schema.sql). O contrato de persistência e as decisões estão em [DATABASE.md](DATABASE.md); o roteiro de validação está em [DATABASE_MANUAL_TEST.md](DATABASE_MANUAL_TEST.md). Não manter uma segunda cópia do DDL nesta arquitetura.

O modelo contempla cofres, agentes, destinatários permitidos, credenciais de agentes, pagamentos e eventos administrativos. Valores são inteiros em lamports; segredos do cofre ficam fora do SQLite, referenciados por identificador protegido. Carteiras e IDs públicos não autenticam usuários.

## 6. Motor de Políticas e Liquidação

1. Autenticar a credencial e verificar vínculo com o agente solicitado; autenticar o proprietário nas operações administrativas.
2. Resolver idempotência: repetir a mesma chave e payload retorna o pagamento existente; payload diferente retorna conflito.
3. Obter saldo observado do cofre e estimar taxa, então abrir uma transação SQLite curta (`BEGIN IMMEDIATE`). Revalidar congelamento do cofre/agente, whitelist, teto individual e orçamento.
4. Serializar o executor por cofre e reconciliar saldo por contexto/slot e assinaturas para evitar saldo antigo ou desconto duplicado. Reservar valor e taxa atomicamente considerando todos os agentes do cofre. O orçamento do agente conta o valor, sem taxa; o saldo disponível do cofre desconta ambas as parcelas.
5. Confirmar a transação local antes de chamadas RPC. Persistir a transação assinada ou referência durável recuperável, assinatura e validade do blockhash antes de enviar à rede.
6. Enviar, acompanhar e reconciliar a liquidação. Aprovação da política não significa confirmação onchain. Resultado incerto conserva a reserva em `UNKNOWN`; nunca criar uma nova transferência automaticamente por timeout.
7. Registrar bloqueios localmente e alterações administrativas em auditoria. Só pagamentos enviados têm assinatura onchain; bloqueios não geram transferência.

A janela do agente é móvel de 24 horas, ancorada no momento da reserva. Pagamentos pendentes ou incertos contam independentemente da idade até reconciliação. Confirmados contam quando `reserved_at` pertence às últimas 24 horas. Falha comprovada libera a reserva; não usar expiração de relógio como prova de ausência de pagamento.

O congelamento global impede novas autorizações e novos envios ainda canceláveis. Uma transação já enviada à Solana não pode ser revogada pelo status local. O instante de corte entre freeze e envio deve ser coordenado e testado no executor.

## 7. Contratos de API Propostos

Estes contratos orientam implementação futura; não indicam endpoints já disponíveis. IDs e endereços não substituem autenticação. Toda resposta omite hashes de credenciais e referências de segredo.

### Autenticação do proprietário

`POST /api/v1/auth/challenge` recebe a carteira e retorna desafio único com nonce, domínio, rede, emissão e validade. `POST /api/v1/auth/verify` verifica a assinatura, consome o desafio uma única vez e estabelece sessão limitada. Persistência de desafios/sessões, transporte, expiração, revogação e proteção contra replay/CSRF devem ser definidos antes da implementação. O modelo atual não representa esses registros. Conectar Phantom visualmente não autentica a API.

### Pagamento

`POST /api/v1/vault/pay`, com credencial de agente e `Idempotency-Key`, recebe:

```json
{ "agentId": "uuid", "recipient": "base58", "amountLamports": "1000000", "purpose": "Compra de dados" }
```

`amountLamports` e todos os limites são strings decimais canônicas: pagamentos usam `[1-9][0-9]*`; limites permitem também `0`. Máximo `9007199254740991` lamports; validar usando `BigInt` antes de qualquer conversão para APIs numéricas. Rejeitar sinais, zeros à esquerda, frações e notação científica. Respostas serializam valores monetários como strings. Timestamps usam UTC em segundos inteiros no banco e formato explícito no contrato HTTP.

A resposta expõe `transactionId`, `policyDecision`, `settlementStatus` e, se existente, `solanaSignature`. Nova autorização pendente retorna 202; bloqueio de política retorna 422; autenticação/autorização retorna 401/403; reutilização conflitante da chave retorna 409. Repetição válida retorna o registro existente sem repetir efeito financeiro. `GET /api/v1/transactions/:id` permite acompanhar resultado autorizado por proprietário ou pelo próprio agente.

### Gestão mínima do MVP

| Operação proposta | Autorização e comportamento |
| :--- | :--- |
| `POST /api/v1/vaults`, `GET /api/v1/vaults` | Proprietário autenticado; cria/lista apenas seus cofres. |
| `POST /api/v1/vaults/:vaultId/agents` | Proprietário do cofre; cadastra agente e limites em lamports. |
| `PATCH /api/v1/agents/:agentId` | Proprietário; altera nome, papel, limites e whitelist; audita antes/depois. |
| `GET /api/v1/agents/:agentId/whitelist`, `POST /api/v1/agents/:agentId/whitelist`, `DELETE /api/v1/agents/:agentId/whitelist/:recipientId` | Proprietário; restrição de unicidade por agente/destinatário e auditoria de mudanças. |
| `POST /api/v1/agents/:agentId/credentials`, `DELETE /api/v1/agents/:agentId/credentials/:credentialId` | Proprietário; revela token novo uma vez, armazena só hash e permite revogação. |
| `POST /api/v1/vault/panic` | Proprietário; payload `{ agentId, action }` ou `{ vaultId, action }`, exatamente um alvo; `FREEZE`/`UNFREEZE`; audita. |
| `GET /api/v1/vault/telemetry?vaultId=...` | Proprietário; saldo observado, reservas, agentes, pagamentos e eventos paginados do seu cofre. |

Não expor exclusão física de cofres/agentes com histórico. Depósitos são transferências da carteira do proprietário para `vault_pubkey`; o saldo é observado na rede, sem criar um segundo saldo contábil autoritativo no SQLite.

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
