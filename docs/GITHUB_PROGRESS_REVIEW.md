# Revisão de progresso no GitHub — 2026-10-11

Referências atualizadas com `git fetch origin --prune` e todas as branches confirmadas por `git ls-remote --heads origin`. Nenhum merge, commit ou push realizado. Revisão de histórico e código; testes não foram executados novamente.

| Branch | HEAD | Situação |
|---|---|---|
| main | 292f650 | Documentação e arquitetura inicial; anterior à implementação atual. |
| development | d4e6b08 | Documentação e memória UX; ancestral de main. |
| dev-bernardo | 38445df | Atualização de DATABASE.md; único commit exclusivo, sem funcionalidade exclusiva. A versão atual em bernardo contém o conteúdo mais histórico de modelagem. |
| dev-jotaf | 0dbd63c | Frontend e backend PostgreSQL; integrada em bernardo pelo merge 784f36d. |
| bernardo | f5f192b | Base mais completa: integração das telas e autenticação/isolamento de carteira. |

## Entregas evidenciadas

- `b788bed`: revisão e endurecimento do schema histórico SQLite; não comprova garantias no runtime PostgreSQL.
- `784f36d`: integra dev-jotaf, quatro telas com API, gestão de agentes/cofres, simulador persistido, políticas, notificações e panic. Evidências anteriores: story 03.
- `f5f192b`: login Phantom por assinatura de mensagem, desafio de uso único, sessão HttpOnly, CSRF/origem e isolamento por proprietário/carteira. Evidências anteriores: story 04, 17 testes backend, nove frontend e smoke de 53 requisições. Phantom real e mobile continuam sem validação completa.
- Serviço RPC, saldo e faucet existem. Isso não equivale a executor financeiro entregue.

## Pendências em ordem

1. Escolher autoridade financeira: Phantom por transação ou cofre separado exclusivamente de teste. Login não delega autoridade de transferência. Plano em architecture/DEVNET_PAYMENT_PLAN.md e checklist local em stories/05-devnet-payments.md.
2. Banco PostgreSQL: reserva atômica de saldo/orçamento/taxas, idempotência, valores inteiros, bytes assinados, assinatura e estados persistidos. Manter janela móvel de 24h do PRD, distinguindo-a do dia UTC do simulador.
3. Backend: credenciais de agentes, políticas no caminho financeiro, envio sem duplicação, confirmação, estado UNKNOWN e recuperação após reinício. `/api/transactions` retorna 501; serviço legado não deve ser simplesmente habilitado.
4. Frontend: assinatura conforme modelo escolhido, estados financeiros, Explorer e gastos confirmados separados de simulações.
5. QA: concorrência, replay/conflito, rede indisponível, restart, panic durante pagamento, Phantom real e mobile; comprovar transferência Devnet confirmada sem duplicação.
6. Entrega: deploy HTTPS frontend/API, configuração de sessões/origem/CSRF e migrations, healthcheck, README atualizado, vídeo e submissão. Compose atual contempla apenas PostgreSQL/Adminer; não há workflow em .github na branch bernardo.

## Reconciliação do Trello e documentação

- Header/carteira, simulador interativo e histórico de avaliações têm entregas posteriores aos estados do quadro. Não declarar extrato financeiro onchain concluído.
- README ainda declara SQLite e Wallet Adapter; runtime é PostgreSQL e provider Phantom injetado. Também apresenta cofre delegado e transferências como funcionalidades sem distinguir pendências.
- DATABASE.md afirma que BIGINT PostgreSQL suporta todo u64; incorreto: BIGINT é assinado. Corrigir a faixa no contrato da próxima modelagem financeira.
- Alterações locais anteriores à revisão: AGENTS.md, stories 01/02 e story 05 não rastreada. Não estão publicadas no HEAD remoto.

## Passagem de bastão

Projeto na fase 2: base de gestão e autenticação entregue, executor financeiro pendente. Próxima execução: fechar autoridade e contrato, depois banco → backend → frontend → QA/entrega, com agentes especializados. Backlog multi-token, SDK, alertas externos e previsão de consumo permanece fora desse próximo ciclo.
