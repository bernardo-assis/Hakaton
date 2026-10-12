# Roteiro de teste da aplicação publicada

Site informado: **https://agentsafe.kernellabs.uk/**. Revisão em 12/10/2026 baseada no remoto `main`, commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`. Este é um roteiro de aceite: os resultados abaixo são **esperados**, não uma declaração de que passaram na VPS. Para explicação de cada campo, consulte o [guia completo](USER_GUIDE_PT.md).

Use SOL de teste da Devnet. A Phantom faz login; quem paga é um cofre separado com chave criptografada no backend. Antes do teste, anote a versão publicada se o operador puder confirmá-la.

## 1. Entrar

Abra o site, clique **Launch App → Connect Phantom Wallet**, conecte a extensão e assine a mensagem. O painel deve abrir depois da verificação. Recarregue e confira restauração somente na carteira correspondente. Recusar a assinatura deve manter dados privados ocultos.

## 2. Criar e abastecer o cofre

1. Abra **Vault Budgets → Devnet Payments → Create test vault**.
2. Copie **Devnet SOL deposit address** pelo botão **Copy**. O endereço deve ser diferente da Phantom autenticada.
3. Use o link **Get test SOL from faucet.solana.com**, selecione Devnet e solicite SOL para esse endereço completo. Aguarde saldo; o painel consulta novamente aproximadamente a cada 15 segundos.
4. Selecione **Manual approval** imediatamente: o cofre novo começa em automático no código revisado.
5. Defina **Vault rolling 24-hour limit (SOL)** como `1` e clique **Save limit**.

`Register wallet` / `New vault` fora desse bloco registram uma carteira observada, sem signer de pagamento. Não substituem **Create test vault**. Se o servidor não permitir criação/envio, marque teste como **bloqueado por ambiente**; não registre pagamento aprovado.

## 3. Cadastrar agente e destinatário

Abra **Agent Fleet → Deploy New Agent**:

| Campo | Valor |
|---|---|
| Treasury Vault | O mesmo cofre de teste financiado |
| Agent Name | Agente Teste |
| Purpose | Testar pagamentos Devnet |
| Solana Public Key (Wallet) | Endereço público completo e válido para identificar o agente (obrigatório no cadastro atual) |
| Daily Limit (SOL) | `1` |
| Per-Transaction Limit (SOL) | `0.5` |
| Restrict allowed recipients (Whitelist) | Ativado |
| Allowed addresses | Endereço de uma conta de teste diferente do cofre, que receberá SOL |

Clique **Save Agent** e recarregue. O cadastro e a lista devem persistir. O destinatário pode ser a carteira pública de um amigo: use exatamente o mesmo endereço na lista e nas solicitações.

Alternativa: **Quick Deploy Test Agent** cria agente com `5` SOL/dia, `1` SOL por operação e whitelist **desativada**. Para seguir os resultados abaixo, ajuste os limites para `1`/`0.5`, habilite whitelist e cadastre o destinatário na Fleet. Não mova um agente com histórico/fila usando **Other agents (transfer to this vault)**; crie um agente novo, conforme o achado de realocação descrito no [guia](USER_GUIDE_PT.md).

## 4. Conferir simulação

1. Abra **AI Simulator**, escolha o agente e informe o destinatário permitido em **Solana Recipient Public Key**.
2. Ligue **Start/Stop** e clique uma vez **Well-Behaved Bot (0.5 SOL)**: espere `APPROVED / POLICY_PASSED`, com `SIMULATION / NOT_SUBMITTED`.
3. Clique **Greedy Rogue Bot (6.0 SOL)**: espere `BLOCKED / SINGLE_TX_CAP_EXCEEDED`.
4. Troque o destinatário por uma conta válida fora da lista e clique o bot normal: espere `RECIPIENT_NOT_ALLOWED`.
5. Volte ao destinatário permitido. Não repita até consumir todo o teto.

Esses dois botões não enviam SOL. Simulações aprovadas acumulam no dia UTC; `Clear terminal` não apaga esse consumo. O gráfico/contador de bloqueios do Overview pode incluir essas avaliações, mas histórico de pagamento e saldo gasto permanecem separados.

## 5. Enviar 0.01 SOL com aprovação

1. Volte a **Vault Budgets → Devnet Payments**, escolha o cofre correto e confira **Manual approval** e teto salvo.
2. Selecione **Payment agent**. Preencha **Devnet recipient** com o endereço permitido, **Payment amount (SOL)** com `0.01` e **Purpose** com `Teste manual`.
3. Clique **Request payment**. Espere **Awaiting approval** na fila, sem transferência antes de aprovar.
4. Confira valor e endereço completo; clique **Approve**.
5. Acompanhe **Payment history → View on Solana Devnet**. O aceite exige **Confirmed** no aplicativo e transação finalizada na Devnet, com origem no cofre, destino e valor corretos.

Se ficar **Checking the network**, consulte ID/assinatura e aguarde resultado; não crie outro pagamento com nova intenção. Um HTTP 200, uma assinatura ou aprovação humana isoladamente não comprovam liquidação. Um pedido `Blocked` está registrado, mas não transferiu; a tela pode não exibir o motivo detalhado no cartão, exigindo consulta do detalhe pela API/equipe.

## 6. Proteções e persistência

| Ação | Resultado esperado |
|---|---|
| Criar outro pedido manual e Reject | Rejected; sem envio |
| Solicitar `0.6` SOL | Bloqueado por teto de `0.5` por transação |
| Solicitar `0.01` ao endereço não permitido | Bloqueado por destinatário |
| Pause agente e solicitar | Bloqueado enquanto FROZEN |
| Resume após pausa | ACTIVE; novo pedido permitido se demais regras atendidas, sem envio automático do pedido bloqueado |
| Criar pedido pendente e mudar para Automatic | Pedido anterior ainda exige aprovação individual; novos pedidos podem enviar |
| Recarregar e entrar de novo pelo Launch App | Cofre, agente, modo e histórico preservados |
| Trocar conta da Phantom | Dados anteriores somem; segunda conta não vê dados da primeira |
| Logout e recarregar | Dados privados inacessíveis |

No primeiro teste use poucos valores pequenos para deixar margem de taxas. `VAULT_DAILY_CAP_EXCEEDED` compara principal, taxas e reservas ao teto móvel do cofre, independentemente do saldo existente. Salve novo teto somente se essa for sua intenção; ele não reenvia automaticamente pedidos bloqueados. Depois de confirmar que o pedido antigo está bloqueado e sem envio, use uma nova finalidade, como `Teste após ajuste 2`, para registrar uma intenção nova. Repetir os mesmos campos pode recuperar o pedido antigo. Não faça nova intenção enquanto a anterior estiver enviada/incerta.

## 7. Registrar o resultado real

Preencha uma linha por cenário, sem marcar aprovação apenas porque o guia foi lido:

| Cenário | Horário | Esperado | Obtido | Evidência pública | Estado |
|---|---|---|---|---|---|
| Login Phantom | A preencher | Sessão verificada | A preencher | Captura sem segredos | Não executado |
| Política normal / bloqueio | A preencher | Approved / Blocked | A preencher | Mensagem e agente | Não executado |
| Pagamento 0.01 | A preencher | Confirmed + finalized | A preencher | ID e assinatura Devnet | Não executado |
| Troca de conta | A preencher | Isolamento | A preencher | Captura sem segredos | Não executado |

Estados: **Passou**, **Falhou**, **Bloqueado por ambiente**, **Não executado**. Registre tela, botão, passos, horário, mensagem, cofre/agente e ID/assinatura do pedido. Falhas de faucet exigem verificar saldo/assinatura antes de repetição e logs da própria VPS; não deduza quota excedida só pelo HTTP 500. Não compartilhe cookies, tokens, chaves privadas ou frase de recuperação.
