# AgentSafe — guia completo do usuário

Este guia explica o comportamento encontrado em `origin/main`, commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`, revisado em 12/10/2026. O responsável informou publicação em VPS em **https://agentsafe.kernellabs.uk/**. A revisão do código não comprova qual versão roda lá nem que todos os testes deste guia passaram na instalação. Os nomes dos controles estão em inglês para facilitar encontrá-los na interface.

## 1. O que a aplicação faz

O AgentSafe verifica se uma solicitação de pagamento de um agente obedece ao orçamento, ao limite por operação, aos destinatários permitidos e às regras humanas. Você pode experimentar as regras no simulador e solicitar transferências de **SOL de teste na Solana Devnet**.

O cadastro de um agente é uma identidade e uma configuração de regras. Ele não inicia sozinho um modelo de IA, um robô de negociação ou uma automação externa. Uma automação externa precisa ser integrada pela API e receber sua própria credencial de agente; veja [API REST](api/REST_API.md).

A assinatura da Phantom serve para entrar. O servidor não recebe a chave privada da Phantom. O cofre separado de teste tem outra chave, armazenada de forma criptografada no backend; o servidor consegue assinar os pagamentos desse cofre. As regras são aplicadas no backend, e este protótipo não é um programa de custódia executado on-chain.

## 2. Os endereços: qual vai em cada lugar?

| Nome | O que representa | Onde usar |
|---|---|---|
| Carteira da Phantom | Sua identidade de acesso | Conectar e assinar a mensagem de login |
| Cofre observado | Registro do endereço da Phantom para consultar saldo/políticas | `Register wallet` / `New vault`; não habilita o servidor a sacar dessa carteira |
| Cofre de teste | Conta separada que guarda o saldo usado nos pagamentos | `Create test vault`; financiar o **Devnet SOL deposit address** |
| Chave pública do agente | Identificador público do agente cadastrado | `Solana Public Key (Wallet)` em Agent Fleet; não é a chave que assina o pagamento do cofre |
| Destinatário | Endereço da conta que deve receber SOL | `Allowed addresses`, `Solana Recipient Public Key` ou `Devnet recipient` |

Um amigo pode receber SOL de teste se o endereço completo for válido e estiver permitido pelas regras. Confirme com ele o endereço público Solana e use Devnet para consultar o saldo. Ter um endereço cadastrado não prova que alguém controla aquela conta. Não use o endereço do cofre pagador como destinatário no roteiro: escolha uma conta de teste diferente para conferir origem e destino.

Endereços abreviados, como `6ZbpLzfE…`, são apenas identificação visual. **Copie o endereço completo**, nunca os pontos ou só os primeiros caracteres. Nenhum campo pede frase de recuperação ou chave privada.

## 3. Entrar e navegar

1. Abra o site e clique **Launch App**. **Docs** abre o guia público sem exigir login.
2. No aplicativo, clique **Connect Phantom Wallet**. A extensão precisa estar disponível nesse navegador.
3. Autorize a conexão e confira a mensagem que a Phantom pede para assinar. Ela identifica carteira, origem e prazo de login.
4. Assine. Aguarde a verificação do servidor; apenas conectar a extensão não basta.
5. Use a navegação superior: **Overview**, **Agent Fleet**, **AI Simulator**, **Vault Budgets** e **Docs**.

Recusar a assinatura mantém os dados privados ocultos. Se o desafio expirar, inicie outra tentativa. Trocar de conta na Phantom deve limpar os dados da conta anterior e exigir acesso compatível com a nova carteira. Sair encerra a sessão; não deve bastar atualizar a página para voltar a uma sessão revogada.

A navegação atual é controlada dentro da página, sem rotas completas para cada tela. Entre pelo **Launch App** e use o menu superior. O link `Open Agent Fleet` do painel aponta para `/agents`; se voltar à landing em vez de abrir a Fleet, use o menu **Agent Fleet**. O atalho ainda precisa ser corrigido.

## 4. Criar e abastecer o cofre que paga

1. Vá em **Vault Budgets** e localize o bloco **Devnet Payments**.
2. Clique **Create test vault**. Aguarde a confirmação e anote o endereço completo. Ele deve ser diferente da Phantom usada no login.
3. Em **Test vault**, selecione o cofre recém-criado. O botão **Copy** copia o endereço de **Devnet SOL deposit address**; **Copied!** indica que a cópia foi executada.
4. Clique **Get test SOL from faucet.solana.com** ou abra o [faucet oficial](https://faucet.solana.com/). Selecione Devnet, cole o endereço completo do cofre e siga o pedido de SOL de teste.
5. Volte ao painel e confira **Available balance**. O bloco atualiza aproximadamente a cada 15 segundos enquanto não está processando uma ação. Recarregar/voltar à tela também consulta novamente.
6. Escolha **Manual approval** antes do primeiro teste. Um cofre recém-criado começa em **Automatic** no código revisado.
7. Ajuste **Vault rolling 24-hour limit (SOL)** para um teto de teste adequado, por exemplo `1`, e clique **Save limit**. Digitar sem salvar não altera o teto.

**Create test vault** cria um cofre novo a cada sucesso; não é atualização do saldo. Evite criar vários por não entender uma falha de depósito. Se o servidor disser **Payment sending is disabled on the server** ou que o cofre de teste não está habilitado, registre isso; configuração de publicação é responsabilidade da operação, conforme [DEPLOYMENT.md](DEPLOYMENT.md).

**Register wallet** e **New vault**, fora desse bloco, registram a Phantom como carteira observada. Essa é uma operação diferente de criar um cofre com capacidade de pagamento.

## 5. Cadastrar e configurar o agente

Para testar destinatários permitidos, use o cadastro completo:

1. Vá em **Agent Fleet → Deploy New Agent**.
2. Preencha os campos abaixo e salve. Use ponto em valores decimais, por exemplo `0.5`; o aplicativo admite até nove casas decimais.

| Campo | O que preencher | Exemplo de teste |
|---|---|---|
| Treasury Vault | Cofre que financiará esse agente | O mesmo cofre criado e abastecido no passo 4 |
| Agent Name | Nome para reconhecer o agente | `Agente Teste` |
| Purpose | Finalidade do agente | `Teste de políticas e pagamentos Devnet` |
| Solana Public Key (Wallet) | Endereço público Solana válido para identificar o agente; obrigatório no formulário atual | Uma conta pública de teste disponível para você |
| Daily Limit (SOL) | Teto do agente | `1` |
| Per-Transaction Limit (SOL) | Máximo em uma operação; não pode exceder o teto diário | `0.5` |
| Restrict allowed recipients (Whitelist) | Ative para permitir somente a lista | Ativado |
| Allowed addresses | Destinatários completos separados por vírgula | Endereço da conta de teste que receberá SOL |

O identificador público do agente não precisa ser o destinatário e não delega acesso a essa carteira. Na edição, a chave pública fica desabilitada. **Edit Limits** também abre nome, finalidade, cofre e destinatários; confira todos antes de **Save Agent**. Se aparecer **Agent saved. Could not update recipients**, o agente foi salvo, mas a lista falhou: mantenha o editor aberto e conclua a lista antes de testar pagamentos.

**Pause** muda o agente para `FROZEN`; solicitações novas devem ser bloqueadas. **Resume** retorna a `ACTIVE`; não envia pedidos bloqueados automaticamente. Pesquisa encontra nome, identificador e chave. **Status** alterna `ALL`, `ACTIVE` e `FROZEN`; **Sort by** alterna gasto e nome.

**Emergency: Freeze Fleet** congela os agentes da carteira autenticada. Não é exclusão de dados, cancelamento de transferências já enviadas nem devolução de saldo. Use **Resume** nos agentes que quiser reativar depois; pedidos já enviados continuam exigindo conciliação.

### Atalhos do painel de pagamentos

**Quick Deploy Test Agent** cria e vincula um agente ao cofre escolhido, com teto diário de **5 SOL**, teto por transação de **1 SOL** e **whitelist desativada**. Gera um identificador público aleatório de teste; não entrega chave privada nem credencial de API. O limite do cofre continua independente. Para testar a proteção de destinatários, abra **Edit Limits**, ative a whitelist e salve a lista.

**Payment agent** separa agentes do cofre atual de **Other agents (transfer to this vault)**. Escolher um desses outros agentes **altera o cofre associado ao agente**, não apenas a seleção da tela. Há uma limitação relevante: consultas financeiras seguem o cofre atual do agente. **Crie um agente novo no cofre certo; evite mover um agente com pagamentos, reservas ou fila existente.** A revisão técnica identifica essa realocação como correção pendente.

## 6. Simular as regras sem transferir SOL

1. Abra **AI Simulator** e selecione o agente.
2. Em **Solana Recipient Public Key**, cole o destinatário que já consta em **Allowed addresses**.
3. Ligue **Start/Stop**. Deve aparecer **Simulator active / LIVE**; estar ativo apenas habilita as ações, não inicia gastos periódicos.
4. Clique uma vez **Well-Behaved Bot (0.5 SOL)**. Com agente novo, ativo, limite adequado, destinatário permitido e políticas compatíveis, espere `APPROVED: POLICY_PASSED` e `SIMULATION / NOT_SUBMITTED`.
5. Clique **Greedy Rogue Bot (6.0 SOL)**. Com limite por transação `0.5`, espere `BLOCKED: SINGLE_TX_CAP_EXCEEDED`.
6. Pare o simulador. Os botões ficam inativos.

As avaliações aprovadas acumulam **SOL simulated** no dia UTC. Bloqueios não representam dinheiro enviado. **Clear terminal** limpa a visualização de logs, preservando histórico e consumo persistidos; não restaura orçamento. O orçamento do simulador vira em **00:00 UTC** (21h do dia anterior no fuso da Bahia). Esse contador é independente dos pagamentos reais em janela móvel de 24 horas.

**Request Devnet Payment (0.5 SOL)** é diferente dos dois botões acima: ele faz uma solicitação real de SOL de teste ao executor. Requer agente de cofre separado e segue o modo de aprovação. Para o primeiro envio pequeno, use `0.01` no formulário do próximo passo.

## 7. Solicitar o primeiro pagamento de 0.01 SOL

1. Volte a **Vault Budgets → Devnet Payments**. Confira o cofre financiado e **Manual approval**.
2. Em **Payment agent**, escolha o agente desse cofre.
3. Em **Devnet recipient**, informe exatamente o destinatário permitido.
4. Em **Payment amount (SOL)**, digite `0.01`. Em **Purpose**, escreva `Teste manual 0.01 SOL` (até 280 caracteres no formulário).
5. Clique **Request payment** uma vez. Pode aparecer **Request recorded: Awaiting approval**. Um pedido registrado ainda não é pagamento confirmado.
6. Na **Approval queue**, confira agente, endereço completo, finalidade e valor. Clique **Approve** para autorizar esse pedido ou **Reject** para recusá-lo.
7. Acompanhe **Payment history**. Quando existir assinatura, abra **View on Solana Devnet**.
8. O aceite exige **Confirmed** no aplicativo e transação finalizada no Explorer: origem no cofre correto, destino correto e valor `0.01 SOL`.

A aprovação revalida orçamento, saldo e regras atuais. Se a revalidação falhar, o botão Approve retorna um erro e o pedido permanece na fila como PENDING: corrija a condição ou rejeite o pedido. Isso é diferente de uma nova solicitação gravada como BLOCKED. Pedidos apenas aguardando aprovação ainda não reservam saldo; reservas aparecem na etapa de preparação/envio. Não execute dezenas de tentativas para descobrir se um envio terminou.

### Estados que você verá

| Estado na tela | O que significa | Próxima ação |
|---|---|---|
| Awaiting approval | Falta aprovação humana | Conferir e usar Approve/Reject |
| Awaiting submission | Ainda não foi enviado | Acompanhar; não contar como gasto confirmado |
| Sent to the network | Foi transmitido; falta resultado final | Acompanhar assinatura e histórico |
| Checking the network | Resultado ainda incerto | Verificar pedido e assinatura; não assumir falha ou reembolso |
| Confirmed | Servidor encontrou confirmação final | Conferir transação no Explorer |
| Blocked | Regras impediram envio desse pedido | Consultar motivo; corrigir configuração antes de novo pedido |
| Rejected | Responsável recusou o pedido | Não será enviado por essa aprovação |
| Failed | Resultado de falha conhecido | Conferir motivo/assinatura; pode haver taxa paga se falhou on-chain |

O painel mostra até **100 pedidos recentes**, sem simulações. **Load more requests awaiting approval** carrega páginas adicionais da fila. A tela atual não mostra todos os códigos de bloqueio nos cartões: registre o ID e consulte o detalhe pela API ou peça à equipe que localize esse pedido; não deduza o motivo só pela cor vermelha.

**Automatic** permite envio imediato de novos pedidos válidos. Passar de manual para automático preserva a fila antiga, que exige aprovação individual. Passar de automático para manual exige aprovação de pedidos ainda não enviados. Uma regra global de aprovação acima de um valor pode exigir aprovação mesmo em modo automático.

## 8. Saldo, limites e reservas

| Número | Significado |
|---|---|
| Available balance | Saldo consultado na rede, descontando reservas ainda não concluídas |
| Reserved for requests | Principal e estimativa de taxa comprometidos em pedidos preparados/enviados/incertos |
| Spent in 24 hours | Pagamentos confirmados e taxas pagas dentro da janela usada pelo executor |
| Vault rolling 24-hour limit | Teto total do cofre para todos seus agentes, incluindo taxas/reservas |
| Daily Limit do agente | Teto do principal do agente; executor usa janela móvel de 24 horas |
| SOL simulated | Avaliações aprovadas do simulador, no dia UTC; não é saldo gasto |

**Ter saldo não equivale a ter orçamento permitido.** Um cofre com 2 SOL e limite de 1 SOL ainda bloqueia gastos que excedam 1 SOL. Dois pagamentos de `0.5` SOL podem passar do limite de `1` SOL por causa das taxas. Prefira `0.01` no primeiro teste.

Reservas de pedidos incertos continuam protegidas até o resultado ser conhecido, mesmo após a passagem de 24 horas. `Unavailable` significa que a consulta de saldo não conseguiu obter um valor confiável; não é necessariamente zero. Não some “gasto” outra vez ao saldo da rede: o saldo confirmado já reflete as transferências.

## 9. Overview e notificações

**Overview** apresenta saldo agregado dos cofres, agentes, limites e pedidos recentes. Se houver vários cofres, o saldo principal não representa necessariamente apenas o cofre do painel de pagamentos. Use **Devnet Payments** para conferir saldo, reservas e gasto do pagador selecionado.

Contadores de bloqueio e o gráfico aprovado/bloqueado incluem avaliações do simulador no main revisado. **Approved** significa que uma regra aprovou a intenção; somente `CONFIRMED` comprova liquidação no aplicativo. A tabela **Recent Transactions** mostra pedidos de pagamento; não use o gráfico como prova de envio.

Pesquisa e filtro reduzem a tabela exibida. Marcar checkboxes seleciona linhas localmente; não aprova, cancela ou apaga pagamentos. **Deposit SOL** abre escolha de cofre e valor e solicita faucet Devnet para o endereço desse cofre; não debita a Phantom. O pedido está sujeito à disponibilidade externa. **Withdraw Funds → Check Availability** usa o caminho de saque desabilitado e deve informar indisponibilidade; a execução suportada acontece em **Devnet Payments**.

Abra o sino para ver notificações de auditoria ou estado vazio. Uma notificação não substitui a assinatura e o resultado da transação.

## 10. Políticas e orçamentos globais

Na tela **Vault Budgets** há **dois seletores independentes**: **Selected vault** no topo e **Test vault** dentro de Devnet Payments. As regras globais abaixo valem para o seletor do topo; modo e teto de pagamento valem para o cofre do bloco. Para configurar o pagador, selecione o mesmo endereço nos dois e confira novamente após criar um cofre ou trocar de tela.

**Configure policy** define **Low Balance Floor (SOL)** e **Human Approval Threshold (SOL)**. Clique **Save** e habilite os controles correspondentes:

| Controle | Efeito |
|---|---|
| Pause fleet on low balance | Bloqueia uma avaliação/pagamento que deixaria saldo abaixo do piso configurado; não é transferência nem exclusão |
| Require human approval | Acima do limiar, simulador bloqueia com APPROVAL_REQUIRED; pagamento real entra na aprovação humana |
| Restrict recipients | Exige que o destino conste na lista do agente, mesmo com whitelist individual desativada |

Ajustar limites de um agente aqui grava os mesmos limites usados em Fleet e Simulator. **Liquidity recommendation** calcula recomendação com regras e informa que não transferiu fundos; não é rebalanceamento automático por IA. **Export** baixa `agentsafe-vault-budget.json` com o cofre do topo e seus agentes; não é backup integral do banco, dos signers ou da VPS.

## 11. Erros comuns e como conferir

| Mensagem | Explicação | O que fazer |
|---|---|---|
| RECIPIENT_NOT_ALLOWED | Destinatário fora da lista exigida | Edit Limits → Allowed addresses; salvar lista e usar o mesmo endereço completo |
| SINGLE_TX_CAP_EXCEEDED | Valor acima do teto por operação | Reduzir valor ou revisar o teto do agente |
| DAILY_CAP_EXCEEDED | Teto do agente atingido | Conferir consumo do simulador ou do executor, conforme a ação |
| VAULT_DAILY_CAP_EXCEEDED | Teto do cofre não comporta principal, taxas e compromissos | Conferir Spent/Reserved e salvar teto apropriado; adicionar saldo sozinho não resolve |
| INSUFFICIENT_BALANCE | Saldo livre não cobre principal e taxa | Financiar o cofre correto e consultar novamente |
| LOW_BALANCE | Pagamento violaria o piso de saldo | Conferir política e saldo do cofre correto |
| APPROVAL_REQUIRED | Simulação acima do limiar humano | Esperado no simulador; pagamentos reais usam fila de aprovação |
| AGENT_FROZEN / Vault or agent is frozen | Agente ou cofre congelado | Conferir status; reativar somente o registro de teste que deseja usar |
| Request recorded: Blocked | Pedido registrado, mas não enviado pelas regras | Localizar motivo; mudar limite não reenvia esse pedido automaticamente |
| Internal Server Error | Falha interna sem causa pública detalhada | Registrar horário/ação/ID e consultar logs da mesma VPS; não concluir causa a partir da mensagem |
| HTTP 429 | Muitas chamadas para um serviço | Respeitar tempo de espera indicado; reduzir repetição |
| HTTP 401 | Sessão ou credencial inválida/expirada | Entrar novamente ou revisar credencial; não usar dados da conta anterior |
| HTTP 409 | Conflito, versão antiga ou condição incompatível | Atualizar estado e consultar histórico antes de repetir |

Se **Deposit SOL** falhar, o airdrop pode ter sido aceito antes de falhar a confirmação. Confira o saldo do cofre e eventual assinatura antes de repetir. Como alternativa use o faucet oficial com o **endereço completo do cofre**, nunca o identificador abreviado.

Após resposta de transporte perdida em pagamento, mantenha agente, destinatário, valor e finalidade para repetir a mesma intenção: o frontend preserva a chave da tentativa. Alterar campos ou usar o outro botão pode representar um pedido novo. Depois de um bloqueio comprovadamente terminal e sem envio, corrigir o teto e repetir os mesmos campos pode retornar o pedido antigo bloqueado. Para um teste novo, altere a finalidade, por exemplo `Teste após ajuste 2`, identificando uma nova intenção; faça isso somente após confirmar que a anterior está bloqueada e não enviada. Não use esse procedimento para SUBMITTED/UNKNOWN. Consulte histórico/assinatura antes; não limpe o armazenamento do navegador para contornar o estado incerto.

## 12. Como registrar o teste e o que ainda falta comprovar

Use o [roteiro publicado](PUBLISHED_APP_MANUAL_TEST_PT.md) e registre: data/hora, endereço do site, versão instalada quando conhecida, carteira pública de teste, cofre, agente, ação, resultado esperado, resultado obtido, ID do pedido e assinatura pública. Preserve a distinção entre **passou**, **falhou**, **bloqueado por ambiente** e **não executado**.

Ainda é necessário um registro de aceite com Phantom real, pagamento financiado finalizado, isolamento de duas contas e revisão de acessibilidade/dispositivos. Para operação da VPS, conferir versão publicada, backup e restauração, monitoramento, segredos e configuração conforme [guia de publicação](DEPLOYMENT.md) e [runbook da VPS](VPS_RUNBOOK.md). Achados e testes desta revisão estão no [relatório da main/VPS](MAIN_VPS_REVIEW_2026-10-12.md). O presente guia não afirma acesso administrativo à VPS nem execução desses testes.

A realocação de agentes com histórico financeiro e o link `/agents` citado acima são achados da revisão. Eles precisam de correção/validação separada. Depoimentos, preços e promessas da landing devem corresponder a evidências reais de negócio e ao escopo Devnet; texto promocional sozinho não prova contratação, auditoria externa ou suporte a mainnet.

Fontes do comportamento: [App](../frontend/src/App.tsx), [Fleet](../frontend/src/pages/AgentFleet.tsx), [Simulator](../frontend/src/pages/Simulator.tsx), [Vault Budgets](../frontend/src/pages/VaultBudgets.tsx), [painel de pagamentos](../frontend/src/components/DevnetPayments.tsx), [serviço de pagamentos](../backend/src/services/paymentService.ts) e [API REST](api/REST_API.md). São referências de implementação; o hash acima identifica o código revisado.
