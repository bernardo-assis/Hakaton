# Memória do projeto

As instruções de equipe fornecidas pelo usuário nesta sessão continuam aplicáveis. Este arquivo registra aprendizados locais; não substitui essas instruções.

## Regra de branches

- Fazer commits neste projeto somente na branch `bernardo`.
- Não mudar para `develop` ou `main`, nem integrar ou enviar alterações para essas branches, sem instrução explícita do usuário.
- Antes de cada commit, verificar que a branch ativa é `bernardo`.

## Lições Aprendidas

- 2026-10-09 — Integração de telas: cada controle precisa de ação real, estados de carregamento/erro/vazio e validação no navegador; build aprovado não confirma funcionamento. Toda persistência passa pela API. Avaliações do simulador em `audit_events` não representam pagamentos ou saldo gasto na Solana; autorização e liquidação devem aparecer separadas.
- 2026-10-09 — PostgreSQL e testes: JSONB pode reordenar chaves; comparar os campos normalizados da solicitação ao verificar idempotência, nunca a ordem de `JSON.stringify`. Usar fixtures com identificadores únicos e limpeza específica, preservando dados do usuário.
- 2026-10-09 — Serviços locais: `ts-node src/server.ts` não recarrega alterações automaticamente. Depois de modificar o backend, reiniciar o processo e verificar a API em execução, além dos testes de integração. O proxy Vite em Docker deve apontar para o backend na mesma rede; no host, usar localhost.
- 2026-10-09 — Inicialização local: confirmar resposta HTTP antes de informar que a aplicação está disponível. Sem Node.js no host, frontend e backend podem rodar em containers Node com volumes separados para dependências; o Vite deve escutar em `0.0.0.0` e o backend deve acessar PostgreSQL pelo nome do serviço na rede Docker. Containers locais desta sessão: `agentsafe_frontend_local`, `agentsafe_backend_local` e `agentsafe_pg`.
- 2026-10-08 — Revisão AgentSafe: antes de considerar uma modelagem de pagamentos completa, verificar representação inteira dos valores, idempotência, reserva atômica de orçamento/saldo, estados de confirmação e recuperação após reinício. Receber uma assinatura não comprova liquidação. Revisão: docs/architecture/DATABASE_REVIEW.md.
- 2026-10-08 — Implementação da modelagem: manter DDL executável em `backend/src/db/schema.sql` como fonte única e validar restrições em SQLite real. Não declarar orçamento concorrente, autenticação ou liquidação implementados apenas porque o schema aceita seus registros; essas garantias também exigem serviços e testes de integração.

- **Nova Lição (Delegação Obrigatória):** É ESTRITAMENTE PROIBIDO o agente principal (Maestro/Orquestrador) assumir os papéis e codificar por conta própria para "economizar tempo" ou "ajudar". O Orquestrador DEVE obrigatoriamente invocar subagentes especializados (ex: `@dev-back`, `@dev-front`) usando a ferramenta `invoke_subagent` para a execução real do código. O papel do Maestro é puramente coordenar, validar e guiar a passagem de bastão, respeitando a autonomia e as skills de cada agente.

- 2026-10-09 — Concepção de pagamento Devnet: assinatura de mensagem autentica o controle da carteira, mas não delega ao backend autoridade para movimentá-la. Definir explicitamente Phantom por transação ou cofre separado de teste; reservar orçamento/saldo e persistir bytes assinados e assinatura antes de transmitir. Timeout mantém reserva e exige conciliação, sem reassinatura automática. UNIQUE isolado não garante pagamento único.

- 2026-10-09 — Autenticação por carteira: consumir desafio e criar sessão na mesma transação, vincular o desafio à origem e a um cookie HttpOnly temporário e persistir apenas hash de sessão. Filtrar cada recurso por usuário E carteira proprietária, inclusive agregações e panic, porque registros legados podem associar carteiras diferentes ao mesmo usuário. Login por assinatura não concede autorização de pagamento. Testes devem provar isolamento com duas chaves Ed25519 e limpar apenas fixtures próprias.

- 2026-10-09 — Identidade no React: é obrigatório usar chaves distintas para componentes irmãos, mesmo quando compartilham a mesma geração de sessão (por exemplo, `header-${generation}` e `content-${generation}`). Chaves repetidas retiveram um Header antigo após trocar de carteira. A regressão deve verificar exatamente um Header e ausência do endereço/notificações da conta anterior após troca ou logout.
