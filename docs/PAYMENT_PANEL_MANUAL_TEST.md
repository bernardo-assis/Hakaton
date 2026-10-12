# Teste manual do painel de pagamentos Devnet

Revisado em 12/10/2026 para remoto `main` (`1dd108f`). Critérios esperados; o registro de execução precisa indicar revisão e ambiente. Site informado: https://agentsafe.kernellabs.uk/; demo isolada: http://localhost:8088. Veja [guia do usuário](USER_GUIDE_PT.md) e [publicação](DEPLOYMENT.md).

Phantom autentica o responsável. O servidor assina com a chave criptografada do cofre separado de teste. Use somente SOL Devnet; o painel não transfere da carteira Phantom por delegação de login.

## Preparação

1. Launch App → conectar Phantom e assinar login.
2. Vault Budgets → Devnet Payments → Create test vault. Cofre diferente da Phantom, com endereço completo copiável e faucet oficial como alternativa.
3. Financie o cofre pela Devnet e confira Available balance. Configure Manual approval; cofre novo começa em Automatic. Salve teto do cofre `1` SOL.
4. Crie agente novo nesse mesmo cofre com teto diário `1`, por operação `0.5`, whitelist e destinatário permitido. No formulário normal, chave pública do agente é obrigatória. Quick Deploy usa `5`/`1` e whitelist desativada; ajuste depois na Fleet.
5. Não realoque agente com histórico ou fila pela opção Other agents: o main atual atribui pagamentos ao cofre associado ao agente e essa é uma correção pendente.
6. Se enviar está desabilitado no servidor, registre Bloqueado por ambiente. Não force mudanças na VPS sem procedimento de operação.

## Cenários de aceite

| Caso | Ação | Resultado esperado |
|---|---|---|
| Aprovação manual | Request payment de `0.01` SOL ao permitido | Awaiting approval; sem transferência antes de Approve |
| Liquidação | Approve do pedido acima | Revalidação; acompanhar até Confirmed e finalized no Explorer com origem/valor/destino corretos |
| Recusa | Novo pedido manual → Reject | Rejected; sem broadcast |
| Modo | Criar pendente, mudar para Automatic | Pendente antigo preservado; novos pedidos válidos podem ser enviados |
| Limiar humano | Require human approval e valor acima do limiar | Aprovação ainda necessária, mesmo em Automatic |
| Teto por transação | Request `0.6` com teto `0.5` | SINGLE_TX_CAP_EXCEEDED; sem envio |
| Destinatário | Endereço válido fora da lista | RECIPIENT_NOT_ALLOWED; sem envio |
| Teto do cofre | Teto menor que principal+taxa+compromissos | VAULT_DAILY_CAP_EXCEEDED; sem envio |
| Pausa | Pause agente, pedir pagamento | Bloqueado; após Resume novo pedido pode passar, antigo bloqueado não dispara |
| Emergency Freeze Fleet | Acionar na carteira de teste | Novos envios impedidos para seus agentes, conciliação dos enviados mantida |
| Persistência | Reload/Launch App | Modo, fila, histórico e identidade preservados na carteira correta |
| Isolamento | Trocar conta ou logout | Dados privados anteriores somem |
| Paginação | Fila maior que 100 | Load more requests awaiting approval carrega restante; histórico recente limitado a 100 |
| Edição durante refresh | Digitar cap e esperar 15 segundos | Edição não sobrescrita; Save limit grava explicitamente |
| Mobile | Largura de 390 px | Formulário, endereço completo, fila e histórico utilizáveis, sem cortes |

Os cartões do Payment history mostram estado e link da rede quando existe assinatura, mas **não exibem error_code**. Para conferir motivo do pedido bloqueado, consulte `GET /api/payments/:id` autenticado ou peça ao operador que localize o ID. Não deduza motivo específico só de “Request recorded: Blocked”.

## Tempo de resposta, reservas e identidade da tentativa

Manual pendente não reserva até aprovação. Após preparação/envio, SUBMITTED e UNKNOWN mantêm principal/taxa reservados. Timeout não comprova cancelamento. Spent in 24 hours inclui taxas pagas, inclusive falhas on-chain; o teto móvel também considera reservas. Budget simulado no dia UTC não é gasto do cofre.

O frontend mantém a identidade da intenção em armazenamento do navegador antes do POST. Depois de uma resposta perdida, use exatamente a mesma intenção e consulte histórico/assinatura; não altere valor/finalidade para tentar contornar UNKNOWN. A recuperação consulta a rede e pode reenviar os mesmos bytes, sem assinar outra transferência.

Depois de confirmar um bloqueio terminal sem envio, ajustar limites não libera o pedido antigo. Repetir o mesmo formulário pode recuperar esse bloqueio com a mesma chave. Para testar uma solicitação nova, use uma finalidade diferente (por exemplo `Teste após ajuste 2`) e registre novo ID. Nunca tratar SUBMITTED/UNKNOWN como bloqueio terminal.

## Simulator e documentação pública

No AI Simulator, Well-Behaved/Greedy apenas avaliam regras. Request Devnet Payment (0.5 SOL) solicita pagamento com o mesmo executor e deve mostrar aprovação/rede reais. Para `0.01`, use o formulário do painel. Docs deve permanecer público e mostrar string lamports, intenção estável e endereços/rotas atuais, sem prometer pacote SDK inexistente.

## Registro da execução

Anote esperado, obtido, data/hora, ambiente, revisão, cofre/agente, ID, assinatura e resultado Passou/Falhou/Bloqueado por ambiente/Não executado. Confirmed + finalized exige conferir origem, destino e valor; assinatura isolada não basta. O presente roteiro não declara teste financiado realizado. Se a revalidação no Approve falhar, a chamada retorna erro e o pedido permanece PENDING; não confundir com novo pedido persistido BLOCKED. O [relatório de 12/10](MAIN_VPS_REVIEW_2026-10-12.md) registra os testes atuais (109 backend/13 suítes, 14 frontend, builds e navegador com API controlada) e três reproduções de falha financeira na realocação.

## Automated validation

Run frontend tests and build in the project frontend directory. Browser regression scripts live in `frontend/tests/e2e/`.

- `payments-browser.cjs` uses a trusted injected wallet and mocked API responses. It covers landing entry, English labels, mode changes, previous approval queues, full recipient addresses, owner CSRF requests, uncertain network state, cap edits during refresh, queues above 100 requests, rejection, the Simulator payment action and the mobile payment panel. It does not send funds.
- `wallet-auth-browser.cjs` uses injected Ed25519 keys and the real local authentication backend. It covers missing provider, rejected signatures, session restoration, account switching and logout. Fixtures must be cleaned by their generated wallet IDs only.
- Unit tests cover integer lamports, state labels, Explorer network links, persisted retry identities and the shared owner payment transport. The new English assertions and transport test failed before implementation and passed afterward.

Browser mocks verify UI interaction. A real transfer and network confirmation require a separately authorized funded Devnet test.

## Histórico de auditoria de dependências (11/10/2026)

The dependency audit found no advisories in production dependencies (`npm audit --omit=dev`). The Tailwind 3 build/watch tree has advisories for `braces` (GHSA-vfj7-8cjw-p6xm) and `postcss-selector-parser` (GHSA-rj75-hqrm-r3gf), reported as seven findings including dependent packages. These packages process source-controlled globs and CSS at build time; they are not included in the browser application. The historical registry check found no patched `braces` release or Tailwind 3 upgrade. The suggested Tailwind 4 migration changes the project's build configuration and is not applied as an automatic fix.

## Integration validation (2026-10-11)

- Frontend unit tests: 14 passed. The shared owner payment transport retains a stable request identity after a lost response and preserves pending approval as pending.
- Production build: passed with 42 modules, including the friend's landing, animation dependencies and public Docs module. The main JavaScript chunk is about 524 kB minified; Vite reports its standard size advisory.
- The orchestrator executed the integrated payment browser regression successfully: landing entry and English labels, earlier queue retained after switching to automatic, owner CSRF request, uncertain state without false confirmation, full recipients, cap editing during refresh, more than 100 pending requests, rejection, Simulator request through the same owner payment API and mobile panel without runtime errors. Every payment endpoint was mocked; no funds were transmitted.
- Authentication regression is a separate check against the restarted real local backend. Its results should be recorded by the orchestrator after execution.
