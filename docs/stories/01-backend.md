# Story 01: Backend Core, Database & Solana Devnet Settlement

**Épico:** Infraestrutura de Cofres & Motor de Políticas (AgentSafe)
**Fase:** 2 — Backend; liquidação aguardando definição de autoridade
**Responsáveis:** @sm, @dev-back, @qa
**Status:** API, PostgreSQL e autenticação entregues nas stories 03/04; pagamentos reais pendentes.

## Reconciliação — 2026-10-10

Este cartão histórico foi reconciliado com o código e as evidências das [stories 03](03-ui-integration.md) e [04](04-wallet-auth.md). Marcações representam implementação e validação registradas; não são uma nova execução de testes nesta sessão. O runtime usa PostgreSQL (`pg`), com migrations `0001`–`0003`; `src/db/schema.sql` e seus testes SQLite são legado. Não usar `/api/v1/vault/*` como contrato vigente: rotas atuais estão em `backend/src/app.ts`, e autenticação em `docs/architecture/WALLET_AUTH_API.md`.

## Setup e persistência

- [x] Backend Express/TypeScript/Zod e dependências Solana configurados.
- [x] PostgreSQL: pool em `src/db/database.ts`; migrations de recursos, políticas e autenticação.
- [x] Schema SQLite histórico validado com oito testes em 2026-10-08; isso não valida o runtime PostgreSQL.
- [ ] Seed de cofre custodial e dois agentes de pagamento: depende da autoridade escolhida; dados de demonstração não comprovam este requisito.

## Solana

- [x] Serviço e configuração RPC, consulta de saldo e faucet Devnet implementados; cobertura de regressão registrada na story 04.
- [ ] Cofre assinante e pagamento real seguro: métodos legados `generateKeypair`/`sendLamports` existem, mas a API pública de transferência permanece desabilitada (501). Não constituem liquidação entregue.
- [ ] Persistência pré-envio, confirmação verificada, resultado desconhecido e recuperação após reinício.

## Política e contabilidade financeira

- [x] Simulador backend avalia congelamento, whitelist, teto individual e orçamento de simulação; persiste avaliações em `audit_events` (story 03).
- [ ] RN01–RN05 no executor de pagamentos reais, incluindo congelamento global/individual coordenado com envio.
- [ ] RN03 financeira: janela móvel de 24h UTC conforme PRD, confirmados por `reserved_at` e reservas pendentes de qualquer idade. O simulador usa dia UTC e não satisfaz este requisito.
- [ ] Reserva atômica de orçamento e saldo compartilhado, incluindo taxa.
- [ ] Idempotência de pagamento por agente, conflito de conteúdo e recuperação do mesmo pedido; replay do simulador não comprova pagamento único.

## API e segurança

- [x] Gestor autenticado por desafio assinado, expiração/uso único, sessão revogável HttpOnly, CSRF e origem (story 04).
- [x] Isolamento por proprietário e carteira, incluindo métricas, histórico e panic (story 04).
- [x] Administração de agentes, whitelist e políticas pela API, validação e eventos administrativos (story 03).
- [x] Freeze/resume e panic autenticados em `/api/agents` e `/api/agents/panic`.
- [x] Métricas e histórico em `/api/dashboard`, `/api/agents/:id/history`, notificações e simulador.
- [ ] Credenciais de agentes de pagamento: emissão, hash, validade e revogação.
- [ ] API de pagamento segura: contrato a fechar na story 05. `/api/transactions` retorna 501.
- [ ] Healthcheck dedicado da API e RPC; não existe `/api/v1/vault/health`.

## Validação e entrega

- [x] Builds e testes de API/PostgreSQL registrados nas stories 03/04; story 04: 17 testes backend e smoke HTTP de 53 solicitações, com dois proprietários.
- [x] Isolamento, replay de autenticação, concorrência de desafio, expiração e revogação de sessão validados.
- [ ] E2E financeiro Devnet: pagamento confirmado, limites por transação e 24h, panic e agente congelado.
- [ ] Duplicação, concorrência de pagamentos, falha de rede, recuperação/reinício e credenciais de agente expiradas/revogadas.
- [ ] Auditoria final financeira e guia manual, seguindo [story 05](05-devnet-payments.md).
