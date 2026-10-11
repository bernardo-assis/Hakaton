# Handoff — contrato de pagamentos aprovado

PM → Analyst → UX → Architect → SM: contrato de 2026-10-11 incorporado em `docs/architecture/DEVNET_PAYMENT_PLAN.md` e story 05. Skills correspondentes lidas fisicamente via terminal (view_file não disponível nesta sessão).

Usuário aprovou cofre separado somente Devnet, automático com opção manual no painel. Ambos usam mesmo signer/endereço. Janela móvel 24h, taxas no cofre, modo versionado; não liberar fila ao mudar para automático; aprovação revalida políticas. Legado Phantom permanece observacional. Signer cifrado, chave mestre configurada externamente, nenhum mainnet.

Execução liberada sem pedir novamente escolha: banco aditivo → backend/QA financeiro → frontend → QA/entrega. API e desenho de persistência na seção final do plano. Não ativar TransactionService legado. Somente evidência de teste marca entrega; documentos não significam liquidação implementada.

UX: reutilizar design atual, seletor por cofre com texto de impacto e fila aprovar/rejeitar. Separar aprovação de estado on-chain, manter pendências após reload, não exibir segredo. SM deve dividir execução por camada e criar guia manual/evidências. Sem commit/push nesta tarefa.
