# Story 02: Frontend Dashboard, Solana Wallet & Pitch Simulator

**Épico:** Interface de Gestão e Monitoramento (AgentSafe)
**Fase:** 2 — Frontend integrado; liquidação e validação final pendentes
**Responsáveis:** @sm, @dev-front, @qa
**Status:** Telas e autenticação entregues nas stories 03/04; UX de pagamento real pendente.

## Reconciliação — 2026-10-10

Marcações se apoiam no código e na validação registrada nas [stories 03](03-ui-integration.md) e [04](04-wallet-auth.md), sem alegar nova execução de testes. O cliente vigente é `frontend/src/lib/api.ts`, com rotas `/api/*`. Phantom usa o provider injetado, não Solana Wallet Adapter. Layout usa Tailwind v3.4 e ícones existentes; instalação de outra biblioteca não é critério de aceite.

## Setup e identidade

- [x] React/Vite/TypeScript/Tailwind v3.4 configurados.
- [x] Provider Phantom: conectar, assinar desafio, restaurar sessão, trocar conta e desconectar; erros explícitos.
- [x] Conversão exata dos valores UI para strings em lamports e cliente API com cookies/CSRF.
- [x] Autenticação do gestor e ausência de credenciais duradouras de agente no navegador.
- [ ] Validar manualmente com extensão Phantom real. Provider injetado e assinaturas Ed25519 foram testados; extensão real permanece sem evidência.

## Dashboard e gestão

- [x] Header com carteira e notificações reais/estado vazio; saldo observado na Devnet pela API.
- [x] Overview com métricas, busca, filtros e dados persistidos; avaliações não são gastos onchain.
- [x] Agent Fleet: criar, editar, pesquisar, ajustar limites, freeze/resume, whitelist e panic pela API.
- [x] Vault Budgets: criação de cofre da carteira autenticada, políticas e ajustes persistidos.
- [x] Estados de carregamento, erro e vazio; troca/logout ocultam dados e notificações anteriores.
- [x] História distingue simulação `NOT_SUBMITTED` de pagamentos; saque e transferência indisponíveis.
- [ ] Demonstrar estados financeiros reais RESERVED/SUBMITTED/UNKNOWN/CONFIRMED/FAILED, link Explorer e atualização de gastos após liquidação segura (story 05).

## Simulador e demonstração

- [x] Start/Stop interativos; avaliações legítimas/bloqueadas no backend, limites próprios de simulação e reset sem apagar gasto real.
- [x] Emergência/panic congela agentes e feedback apresenta resultado real da API.
- [ ] Pagamento real de 0.01 SOL na Devnet com assinatura e confirmação verificadas, após decisão da autoridade.
- [ ] Roteiro e vídeo de demonstração de três minutos, com aprovação/bloqueio/panic e distinção entre simulação e pagamento.

## QA

- [x] Builds, nove testes frontend e Chromium registrados na story 04; sem erros JavaScript no fluxo validado.
- [ ] Teste manual da extensão Phantom real e responsividade estreita/mobile.
- [ ] Regressão UI após pagamentos, guia manual e validação final da entrega.
