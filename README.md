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
- 🔍 **Audit Trail Onchain:** Todas as transferências aprovadas geram hash auditável na Solana Devnet em ~400ms.
- 🚀 **Simulador de Pitch (3 Minutos):** Painel interativo para demonstração ao vivo para a banca avaliadora.

---

## 🏛️ Arquitetura

- **Frontend:** React 19 + Vite + Tailwind CSS + Solana Wallet Adapter (Phantom)
- **Backend:** Node.js + Express + TypeScript + Zod
- **Banco de Dados:** SQLite (Better-SQLite3)
- **Web3 Engine:** `@solana/web3.js` conectado à **Solana Devnet**

---

## 📚 Documentação

- [Product Requirements Document (PRD)](./docs/prd.md)
- [Arquitetura do Sistema (ARCHITECTURE.md)](./docs/architecture/ARCHITECTURE.md)
- [Checklist Backend (Story 01)](./docs/stories/01-backend.md)
- [Checklist Frontend (Story 02)](./docs/stories/02-frontend.md)
