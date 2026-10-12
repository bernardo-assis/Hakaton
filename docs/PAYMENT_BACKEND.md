# Pagamentos Devnet — backend

Revisado em 12/10/2026 contra `origin/main` (`1dd108f5675f982fb5fe70d157f78907ad9f13aa`). Evidências locais de 11/10 abaixo são históricas; não comprovam configuração ou pagamentos da VPS. Contrato atual completo em [REST_API.md](api/REST_API.md).

O painel e os agentes usam o mesmo executor. Cofres novos de teste recebem uma carteira separada; a carteira Phantom do responsável continua sendo sua identidade. Cofres antigos que observam a Phantom não recebem uma chave nem têm seu endereço substituído.

## Configuração

- Usar `npm run migrate` ou `npm run start:production` para aplicar as migrações numeradas, incluindo `0004_devnet_payments.sql`, na ordem e com registro/checksum. O SQL de pagamentos é aditivo e não remove dados; não aplicar isoladamente sobre um banco sem migrações anteriores nem editar uma migração já registrada. Restrições novas não corrigem silenciosamente registros antigos.
- `DEVNET_PAYMENTS_ENABLED=true` habilita o executor e o conciliador. O padrão é desabilitado.
- `VAULT_SIGNER_ENCRYPTION_KEY` deve conter exatamente 32 bytes em base64. Manter essa mesma chave entre reinícios; perder ou substituir a chave impede usar os cofres existentes. Armazenar fora do Git e dos logs.
- `SOLANA_RPC_URL` precisa responder com o genesis Devnet esperado. A verificação ocorre antes de preparar ou recuperar pagamentos. Não há suporte a Mainnet.

Nenhuma chave privada da Phantom é recebida. O signer separado usa AES-256-GCM com o UUID do cofre autenticado como AAD. Tokens de agente são exibidos apenas na emissão e persistidos como SHA-256, com expiração de 60 a 86.400 segundos e revogação.

Configuração local realizada em 2026-10-11: `backend/.env` está ignorado pelo Git, com permissão 0600, chave de 32 bytes gerada criptograficamente e executor habilitado. Antes e depois da habilitação havia zero pagamentos pendentes; o guard confirmou o genesis Devnet via RPC e o servidor respondeu HTTP 200. Nenhum financiamento ou pedido financeiro real foi feito. A chave existente é preservada nas próximas configurações; seu valor não aparece nesta documentação nem nos logs.

## API

Rotas do painel exigem sessão por carteira, origem permitida e `X-AgentSafe-CSRF: 1` nas alterações. As respostas usam `{success:true,data:...}`. Valores monetários são strings inteiras em lamports.

| Método e rota | Entrada / finalidade |
|---|---|
| POST `/api/vaults/devnet` | `{daily_cap_lamports?:string}`; cria cofre separado automático |
| GET `/api/vaults/:id/payment-config` | Modo, versão, cap, signer pronto, rede, saldo, reserva e disponibilidade |
| PATCH `/api/vaults/:id/payment-config` | `{execution_mode:"AUTOMATIC"\|"MANUAL",expected_mode_version:string,daily_cap_lamports?:string}` |
| POST `/api/payments` | Pedido do próprio responsável, sem token de agente no navegador |
| POST `/api/agent-payments` | Mesmo pedido, mas `Authorization: Bearer <token>` para automação |
| GET `/api/payments` | Array paginado; query `vault_id`, `approval_status`, `limit` 1–100, `offset` |
| GET `/api/payments/:id` | Recupera intenção específica, mesmo fora da página atual |
| POST `/api/payments/:id/approve` | `{expected_mode_version:string}`; revalida todas as regras |
| POST `/api/payments/:id/reject` | `{}`; rejeita pedido manual ainda não enviado |
| POST `/api/agents/:id/credentials` | `{ttl_seconds?:number}`; padrão 3.600 segundos |
| DELETE `/api/agents/:id/credentials/:credentialId` | Revoga token |

Pedido: `{agent_id,idempotency_key,recipient_pubkey,amount_lamports,purpose?:string}`. O servidor normaliza os valores e calcula o hash; reutilizar uma chave com outro pedido retorna 409. O responsável só pode operar agentes dos próprios cofres. A rota antiga `/api/transactions` permanece desabilitada.

`payment-config` retorna `balance_lamports` e `available_lamports` nulos quando o RPC/configuração não permitem conhecer o saldo, nunca um zero inventado. `reserved_lamports` cobre pedidos enviados sem conclusão, incluindo UNKNOWN de qualquer idade. `spent_24h_lamports` contém consumo liquidado (principal e taxas); `committed_24h_lamports` inclui também reservas pendentes, sem confundi-las com gasto liquidado. O cap do agente conta principal; o cap do cofre conta principal e taxas. Falhas na rede consomem a taxa cobrada, datada na resolução.

## Controle e recuperação

**Limitação nova de main:** o painel/edição agora permite alterar `agents.vault_id`. Pagamentos derivam o cofre por esse vínculo mutável; testes da revisão reproduziram migração de gasto confirmado, fila manual aprovada com outro signer e envio com vínculo desatualizado após corrida. Manter agente com pedidos no cofre original até corrigir. Critérios/evidências em [main architecture review](handoffs/2026-10-12-main-architecture-review.md).

O mesmo lock PostgreSQL por cofre serializa pagamentos, alteração de modo/política/limites, whitelist e botão de pânico. Ele permanece adquirido entre a gravação definitiva da intenção e o envio ao RPC. Chamadas de rede não ocorrem dentro de `BEGIN`/locks de linhas; a transação curta revalida dados antes de persistir a reserva, bytes assinados e assinatura.

Manual aguarda sem reserva financeira e não vai para a rede. Voltar para automático não libera a fila manual; mudar para manual impede novos envios automáticos. Um envio já iniciado pode concluir e continua sob acompanhamento.

O processo do servidor concilia ao iniciar e a cada 15 segundos, apenas quando habilitado. A fila usa `last_reconciled_at` para que pedidos incertos antigos não bloqueiem os seguintes. O conciliador verifica histórico, finalização, assinatura e mensagem esperada; pode retransmitir os mesmos bytes ainda válidos, se as regras atuais permitem. Nunca cria uma assinatura substituta.

`CONFIRMED` exige **finalização** neste executor. Timeout vira `UNKNOWN` e mantém a reserva. Uma assinatura expirada sem evidência conclusiva permanece UNKNOWN e reservada; requer investigação do operador. Esse comportamento conservador pode reduzir a disponibilidade temporariamente, inclusive quando um pagamento já entrou na rede e a consulta falhou. Não há liberação por timeout nem cancelamento fictício.

## Validação realizada

Revisão de main em 12/10: 13 suites / 109 testes existentes e build de produção aprovados em banco descartável (relato do QA coordenador). Três provas adicionais com RPC simulado reproduziram regressões da troca de cofre; passar nessas provas significa **bug reproduzido**, não aceite financeiro. O código de reprodução está no snapshot temporário, sem alteração da implementação ou pagamentos na VPS.

- PostgreSQL real: `docker exec agentsafe_backend_local npm test -- --runInBand` — 9 suites / 39 testes aprovados em 2026-10-11.
- TypeScript: `docker exec agentsafe_backend_local npm run build` — aprovado.
- SDK Solana real com RPC injetado: `docker exec agentsafe_backend_local node tests/payment_network.test.cjs` — assinatura válida, mensagem divergente rejeitada e genesis incorreto bloqueado.
- A migração foi aplicada duas vezes sem perda dos registros existentes.
- A fila de recuperação foi testada com 101 entradas UNKNOWN em tabelas temporárias PostgreSQL, invisíveis ao worker real: depois de verificar as primeiras cem, a entrada 101 passa à primeira posição. Esse teste não cria pedidos reais nem consulta RPC.
- `/api/auth/session` respondeu HTTP 200 após reinício do backend.

Os testes usam RPC injetado: não financiam carteiras e não enviam transferências reais. A confirmação real com Phantom/Devnet financiada continua sendo uma validação externa distinta.

## Roteiro manual

1. Entrar com Phantom na aplicação.
2. Criar cofre de teste separado e conferir que seu endereço é diferente da Phantom.
3. Selecionar esse cofre ao criar um agente; definir limites e destinatários.
4. Usar apenas saldo de teste da Devnet e conferir o estado no explorer antes de considerar pago.
5. Fazer um pedido no painel; confirmar assinatura, taxa e estado finalizado no histórico.
6. Selecionar manual, criar outro pedido e verificar que não foi enviado nem reservado.
7. Voltar a automático e verificar que o pedido manual continua aguardando.
8. Aprovar ou rejeitar o pedido; repetir a aprovação não deve pagar duas vezes.
9. Congelar o agente ou usar pânico; novos pedidos/aprovações devem ser bloqueados.
10. Reiniciar o servidor com a mesma chave de criptografia; pedidos incertos continuam reservados e acompanhados.
