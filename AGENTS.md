# Memória do projeto

As instruções de equipe fornecidas pelo usuário nesta sessão continuam aplicáveis. Este arquivo registra aprendizados locais; não substitui essas instruções.

## Regra de branches

- Fazer commits neste projeto somente na branch `bernardo`.
- Não mudar para `develop` ou `main`, nem integrar ou enviar alterações para essas branches, sem instrução explícita do usuário.
- Antes de cada commit, verificar que a branch ativa é `bernardo`.

## Lições Aprendidas

- 2026-10-11 — Trabalho simultâneo: verificar ancestralidade e a sequência completa antes de integrar commits de colegas. Uma branch pode já conter nossa autenticação e acrescentar um caminho financeiro antigo; preservar landing/traduções/UX não significa habilitar dois executores. Saldo, políticas e signer devem referir-se ao mesmo cofre; adaptar botões ao executor único e validar novamente a versão combinada.

- 2026-10-11 — Executor Devnet: envio e alterações de modo/políticas/panic devem compartilhar o mesmo lock por cofre, mantido entre persistência e broadcast, com RPC fora de transações SQL. Persistir também decisões bloqueadas para que replay após descongelamento não vire pagamento. O limite do agente conta principal; o do cofre inclui taxas. Não descontar novamente pagamentos confirmados de um saldo RPC que já os reflete. Trocar para automático não libera pedidos manuais antigos.

- 2026-10-11 — Revisão de branches: confirmar heads remotos e ancestrais antes de propor integrações. A `dev-jotaf` já está integrada em `bernardo` por `784f36d`; um commit exclusivo de documentação em outra branch não implica funcionalidade pendente. Separar entregas remotas, alterações locais e evidências históricas de testes; métodos Solana existentes não tornam uma rota de transferência desabilitada um executor entregue.

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

- 2026-10-10 — Kanban histórico: reconciliar checkboxes com código e evidências posteriores antes de declarar pendências. Setup PostgreSQL, gestão de telas e autenticação entregues nas stories 03/04 não tornam o executor financeiro completo; replay de simulação e assinatura de login não provam pagamento único ou autoridade de movimentação. Preservar janela móvel de 24h do PRD; dia UTC do simulador não a substitui.

- 2026-10-11 — Painel de pagamentos: manter a chave de idempotência da intenção em armazenamento local com escopo de proprietário e cofre antes do POST. Uma resposta de transporte perdida deve reutilizar a mesma chave após recarga; confirmação de cadastro limpa o formulário. Fila de aprovação e status incerto não representam gasto confirmado, e a mudança para automático não autoriza silenciosamente a fila anterior.
