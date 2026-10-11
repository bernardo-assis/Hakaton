# Story 05: Pagamentos seguros na Solana Devnet

**Status:** Implementação técnica banco/backend/frontend validada em 2026-10-11; demonstração financeira real pendente.
**Ordem executada:** contrato → banco → backend/QA → frontend/QA.
**Pré-requisito entregue:** autenticação e isolamento da story04. Login por assinatura não autoriza gasto da carteira Phantom.

## Decisão aprovada

- [x] Cofre separado exclusivamente Devnet, signer criptografado por cofre; sem importar chave Phantom ou treasury compartilhada.
- [x] Automático padrão de novos cofres, opção manual por cofre; mesmo endereço/saldo/histórico nos dois modos.
- [x] Automático→manual exige aprovação de pedidos não transmitidos; manual→automático preserva fila. Aprovação revalida políticas.
- [x] Janela móvel24h; principal no teto agente, principal+taxas no cofre; pendências de qualquer idade reservam orçamento.
- [x] Contrato documentado, legado observacional sem conversão silenciosa; mainnet proibida.

## 1 — Banco de dados

- [x] Migração aditiva PostgreSQL com modo, signer cifrado, aprovação, taxas e campos de recuperação; schema aplicado sem apagar dados existentes.
- [x] Valores inteiros/string com faixa BIGINT positiva e somas SQL/bigint, sem Number em orçamento.
- [x] Reserva atômica e locks por cofre→agente; concorrência e saldo compartilhado cobertos por fixtures PostgreSQL.
- [x] Confirmados na janela móvel e pendências de qualquer idade; falha comprovada libera principal e mantém taxa recente.
- [x] Restrições, replay/conflito e distribuição justa da conciliação testados em PostgreSQL real com fixtures isoladas.

## 2 — Backend

- [x] Credenciais escopadas por hash/TTL/revogação e owner filter usuário E carteira.
- [x] Frozen, whitelist, limites, orçamento e contabilidade implementados e testados com RPC determinístico.
- [x] Replay recupera pedido; payload divergente409; concorrência/idempotência sem segundo envio nos testes.
- [x] Signer criptografado separado; chave mestre externa ao Git; bytes/assinatura persistidos antes de broadcast.
- [x] Modo versionado, aprovação/rejeição, auditoria e coordenação com panic/políticas.
- [x] Adapter valida finalized, assinatura/mensagem e taxa; UNKNOWN preserva reserva; worker startup/15s recupera bytes sem reassinatura.
- [x] Panic serializado com broadcaster; erros públicos não expõem signer/artefatos.
- [x] Guard genesis Devnet rejeita mainnet; RPC fora de transações SQL testado.
- [x] Gate técnico antes do frontend: 39 testes em9 suítes, build aprovado; adapter com assinaturas reais e RPC injetado passou.
- [ ] Comprovar recuperação física de pagamento pendente após reinício com resultado finalizado na Devnet real.

## 3 — Frontend

- [x] API exclusiva; seletor Automático/Manual por cofre, Devnet explícita e aprovação separada do login.
- [x] Fila aprovar/rejeitar com valor/destinatário completo/finalidade, paginação e efeito da mudança de modo explicado.
- [x] Estados pendente/enviado/UNKNOWN/confirmado/falho/bloqueado e link Explorer somente para assinatura válida.
- [x] Saldo/reservas/gastos consumidos da API; simulações separadas, edição de limite preservada durante polling.
- [x] Intenção persistida para retry/reload, escopo wallet+vault; sessão isolada e conteúdo remonta na troca/logout.
- [x] 13 testes frontend, build aprovado e lint sem erros (9 warnings registrados).

## 4 — QA e entrega

- [x] Regressões técnicas de cap agente/cofre, taxas, saldo, UNKNOWN, versão/replay, credenciais e owner scope em PostgreSQL real; nenhuma rede financeira real nos testes.
- [x] Barreira panic/broadcast comprovada por pg_locks; UNKNOWN48h não perde reserva; RPC fora de BEGIN.
- [x] Navegador desktop/mobile com API mockada: modos, fila preservada, CSRF, UNKNOWN, destinatário completo, edição de limite durante16s de polling, paginação101 e rejeição; execução extended21s sem erros de console/runtime (evidência root).
- [x] Evidências técnicas e limitações em `docs/PAYMENT_QA.md`; guia manual em `docs/PAYMENT_PANEL_MANUAL_TEST.md`.
- [ ] Phantom real: autenticação e operação do painel com extensão/carteira de teste real.
- [ ] Financiamento explícito do cofre e transferência real permitida (0.01 SOL) finalizada na Devnet, com Explorer e contabilidade conciliados.
- [ ] Demonstrar bloqueios reais, ausência de pagamento duplicado e recuperação após falha/reinício do processo com transação on-chain pendente.
- [ ] Atualizar cartões externos e gravar demonstração/pitch de três minutos.

Referências: `docs/prd.md`, `docs/architecture/DEVNET_PAYMENT_PLAN.md`, handoff `2026-10-11-payment-contract.md`, `docs/PAYMENT_QA.md`. Checkboxes técnicos não comprovam transferência real nem entrega final da demonstração financeira.
