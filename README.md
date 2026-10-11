# 🛡️ AgentSafe — Autonomous AI Agent Budget & Security Vault

> **"The Brex for AI Agents on Solana"**  
> Hackathon Submission: **Crypto World’s Fair (Colosseum)** — Track: *Solana / Agentic Payments*

---

## 📌 Visão Geral

O **AgentSafe** é um protocolo e dashboard de **Cofres Inteligentes com Políticas de Gastos Programáveis** construído na rede de alta performance da Solana. Ele resolve o dilema de segurança na economia de agentes de IA: conceder autonomia financeira a robôs autônomos sem expor a carteira mestre do usuário a riscos de drenagem (prompt injection, loops de execução ou alucinações).

---

## ⚡ Principais Funcionalidades

- 💰 **Cofre Delegado Segregado:** Os agentes nunca recebem a chave privada mestre da carteira.
- ⏱️ **Teto Diário & Teto por Transação:** Limites máximos configuráveis com renovação contínua a cada 24h.
- 🎯 **Whitelist de Fornecedores:** Restrição de pagamentos exclusivamente para prestadores de serviço autorizados (APIs, oráculos, nós de GPU).
- 🛑 **Kill Switch Instantâneo (Botão de Pânico):** Congelamento em tempo real de um ou todos os agentes com 1 clique.
- 🔍 **Histórico de decisões e pagamentos:** Decisões, reservas e alterações de controle ficam no PostgreSQL. Pagamentos enviados têm assinatura consultável na Devnet; só entram como confirmados após finalização, sem promessa de tempo fixo.
- 🔀 **Execução automática ou aprovação manual:** O mesmo cofre separado atende ambos os modos. Trocar para automático não libera pedidos manuais antigos silenciosamente.
- 🚀 **Simulador de Pitch (3 Minutos):** Painel interativo para demonstração ao vivo para a banca avaliadora.

---

## 🏛️ Arquitetura

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS; integração com o provider da extensão Phantom.
- **Backend:** Node.js + Express + TypeScript + Zod
- **Banco de Dados em execução:** PostgreSQL 15 (`pg`); migrações em `backend/src/db/migrations`. O schema SQLite histórico e seus testes não são a persistência do servidor atual.
- **Web3 Engine:** `@solana/web3.js` conectado à **Solana Devnet**

O responsável entra por assinatura de mensagem com Phantom. Isso autentica sua identidade, sem delegar sua carteira pessoal. O executor usa uma carteira nova por cofre de teste, com chave criptografada no servidor. Tokens de agente têm escopo, expiração e revogação; nunca precisam ficar no navegador do painel.

## Execução e validação

O backend conserva valores inteiros em lamports, idempotência por agente, reservas atômicas, whitelist, congelamento e limites móveis de 24h. O limite do agente considera o valor enviado; o limite independente do cofre também cobre taxas. Pagamentos manuais aguardam aprovação sem reservar saldo e revalidam as regras ao aprovar.

Bytes assinados e assinatura são gravados antes de transmitir. Após timeout, `UNKNOWN` mantém a reserva. O servidor concilia ao iniciar e a cada 15 segundos; recupera a mesma assinatura e pode retransmitir os mesmos bytes válidos, sem assinar uma transferência substituta. A fila distribui verificações entre pedidos, evitando que cem incertezas antigas impeçam acompanhar pedidos novos.

As rotas do painel usam sessão por carteira e proteção de origem. A automação chama `/api/agent-payments` com credencial de agente; o painel pode chamar `/api/payments` com sua sessão, sem guardar essa credencial. A rota antiga de transferência `/api/transactions` continua desabilitada.

Na configuração local desta sessão, o executor Devnet está habilitado e a chave de criptografia está no arquivo ignorado `backend/.env`, com acesso restrito. Não versionar esse arquivo nem substituir a chave usada pelos cofres existentes. O genesis Devnet foi verificado e não havia pagamentos pendentes ao habilitar. Nenhum cofre foi financiado e nenhuma transferência real foi enviada nesta entrega.

Validação automatizada: PostgreSQL real e RPC injetado, além de serialização/assinaturas reais da SDK Solana. Consulte o guia para comandos, API, estados e teste manual.

## Pendências para demonstração e publicação

- Validar o fluxo financeiro completo com saldo **de teste** na Devnet e conferir finalização no explorer. Os testes injetados não substituem essa validação.
- Concluir a validação no navegador do seletor de modo, pedidos manuais, troca de carteira e telas em celular.
- Preparar hospedagem, gestão de segredos/backup, README de publicação, vídeo e submissão do hackathon.
- Suporte financeiro atual é SOL. USDC/USDT não foram implementados pelo executor desta entrega.
- Uma assinatura expirada sem evidência conclusiva continua UNKNOWN e reservada para investigação; o sistema não libera fundos apenas por timeout.

---

## 📚 Documentação

- [Product Requirements Document (PRD)](./docs/prd.md)
- [Arquitetura do Sistema (ARCHITECTURE.md)](./docs/architecture/ARCHITECTURE.md)
- [Checklist Backend (Story 01)](./docs/stories/01-backend.md)
- [Checklist Frontend (Story 02)](./docs/stories/02-frontend.md)
- [Contrato e plano Devnet](./docs/architecture/DEVNET_PAYMENT_PLAN.md)
- [API, configuração e teste manual de pagamentos](./docs/PAYMENT_BACKEND.md)
- [Evidências de QA financeiro](./docs/PAYMENT_QA.md)
