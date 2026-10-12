# Guia de testes do backend com os contratos atuais

Revisão em 12/10/2026 baseada no remoto `main` (`1dd108f`). Este documento substitui o roteiro antigo de usuário/senha, chaves inventadas e transferência por `/transactions`. Login por carteira e execução de pagamentos são caminhos separados. Para quem quer testar pela tela, comece no [roteiro publicado](PUBLISHED_APP_MANUAL_TEST_PT.md).

## 1. Ambiente e ferramentas

- API publicada através do mesmo domínio: `https://agentsafe.kernellabs.uk/api`.
- Demo Docker: `./scripts/demo.sh up`; navegador em `http://localhost:8088` e `/api` no mesmo domínio local.
- Desenvolvimento: API usual `http://localhost:3001/api`, frontend `http://localhost:5173`.

Use Postman, ou testes automatizados do projeto. Banco é PostgreSQL, iniciado por migrações numeradas e preservação de dados. Não use schema SQLite histórico nem `setup.js` para preparar o runtime. [DEPLOYMENT.md](DEPLOYMENT.md) explica inicialização e configuração.

Configure variáveis `base_url` (sem `/api`), `origin`, `owner_pubkey`, `vault_id`, `agent_id`, `recipient_pubkey`, `payment_id` e `mode_version`. Endereços/IDs dos exemplos abaixo são variáveis: preencha com valores reais obtidos na própria conta de teste. Não invente pubkey, assinatura ou hash. A versão pública da VPS precisa ser confirmada pelo operador; URL alcançável não prova revisão.

Respostas de negócio têm `success`, `data` ou `error`. Um HTTP 200 de pagamento não significa transferência confirmada; examine approval_status, settlement_status e decision.

## 2. Autenticar por mensagem, com cookies

Importe [wallet-auth.postman_collection.json](postman/wallet-auth.postman_collection.json). A coleção contém emissão de desafio, verificação, consulta de sessão, logout e cenários negativos com pré-condições.

Mutações do responsável exigem estes cabeçalhos e o cookie jar da sessão:

```text
Content-Type: application/json
Origin: {{origin}}
X-AgentSafe-CSRF: 1
```

1. `POST {{base_url}}/api/auth/challenge` com `{"owner_pubkey":"{{owner_pubkey}}"}`. Preserve o cookie temporário retornado.
2. Assine **os bytes UTF-8 exatos da mensagem retornada** usando carteira/provider de teste. A assinatura é Ed25519 de 64 bytes, enviada como base64 padrão.
3. `POST /api/auth/verify` com `{"challenge_id":"{{challenge_id}}","signature":"{{signature_base64}}"}` no **mesmo cookie jar e Origin**. O desafio expira em cinco minutos e é de uso único.
4. `GET /api/auth/session` deve indicar authenticated e a carteira correta.

Postman não acessa a extensão Phantom para assinar automaticamente. Assinar no navegador depois de emitir outro desafio não serve: mensagem e cookie devem ser os do mesmo fluxo. Para teste leigo, use o navegador; para integração técnica, fixtures Ed25519 do projeto em ambiente isolado. Não copie cookies/segredos de usuários para documentos.

Não criar conta por `POST /users`: caminho legado indisponível. A identidade de usuário/carteira vem da sessão verificada, nunca de um user_id escolhido no corpo.

## 3. Criar o cofre de teste

`POST {{base_url}}/api/vaults/devnet`, autenticado:

```json
{
  "daily_cap_lamports": "1000000000"
}
```

Espere HTTP 201 e `data.id`/`data.vault_pubkey`; salve `vault_id`. A criação gera conta separada e signer criptografado. Financie **esse endereço** com SOL Devnet via faucet oficial e confira saldo. Não use `POST /vaults` genérico ou chave KMS inventada.

`POST /vaults/local` com sua owner_pubkey registra apenas carteira observada, sem signer de pagamento. A assinatura de login não delega fundos dessa carteira.

`GET /vaults/{{vault_id}}/payment-config` retorna modo, versão, teto, disponibilidade de envio, saldo, reservas e gasto. Salve `data.mode_version`. Configure modo manual antes de enviar:

`PATCH /vaults/{{vault_id}}/payment-config`:

```json
{
  "execution_mode": "MANUAL",
  "expected_mode_version": "{{mode_version}}",
  "daily_cap_lamports": "1000000000"
}
```

Use a versão atual a cada alteração; conflito de versão pode retornar 409. Se configuração desabilitar o executor, registre Bloqueado por ambiente; não declare pagamento testado.

## 4. Criar um agente com lista permitida

`POST /agents` com autenticação:

```json
{
  "vault_id": "{{vault_id}}",
  "name": "Agente Teste API",
  "role": "Validação Devnet",
  "agent_pubkey": "{{agent_pubkey}}",
  "daily_cap_lamports": "1000000000",
  "single_tx_cap_lamports": "500000000",
  "whitelist_enabled": true
}
```

`agent_pubkey` é uma chave pública Solana válida obrigatória nesse contrato; use uma conta de teste existente para identificação. Ela não assina pelo cofre. A API deve rejeitar valores inválidos/teto por transação maior que diário. Salve `data.id` em `agent_id`.

`PATCH /agents/{{agent_id}}/whitelist` substitui a lista:

```json
{
  "recipients": [
    { "recipient_pubkey": "{{recipient_pubkey}}", "label": "Destinatário de teste" }
  ]
}
```

Utilize conta destinatária completa válida e diferente do cofre. Não realoque um agente com histórico/fila para outro cofre: o main revisado possui risco de atribuição financeira pela associação atual do agente. Crie um agente novo na conta correta.

## 5. Simular sem broadcast

`POST /simulator/evaluate`:

```json
{
  "agent_id": "{{agent_id}}",
  "amount_lamports": "500000000",
  "recipient_pubkey": "{{recipient_pubkey}}",
  "purpose": "Simulação de regras",
  "request_id": "teste-simulacao-1"
}
```

Resultado com condições acima: APPROVED / POLICY_PASSED, `mode=SIMULATION`, `settlement_status=NOT_SUBMITTED`. Não há transferência. `6000000000` supera o teto por operação e deve bloquear; use outra request_id para outra avaliação. Destinatário válido fora da lista deve bloquear com RECIPIENT_NOT_ALLOWED.

Consulta: `GET /simulator/history`. Avaliações aprovadas usam o orçamento do simulador no dia UTC; não são gasto real do cofre, e limpar terminal não limpa esse consumo.

## 6. Solicitar e aprovar pagamento de 0.01 SOL

`POST /payments` com a sessão do responsável:

```json
{
  "agent_id": "{{agent_id}}",
  "idempotency_key": "teste-pagamento-001",
  "recipient_pubkey": "{{recipient_pubkey}}",
  "amount_lamports": "10000000",
  "purpose": "Teste manual API 0.01 SOL"
}
```

`1 SOL = 1.000.000.000 lamports`; valores de pagamento são **strings inteiras**, sem ponto decimal na API. O servidor calcula request_hash; não enviar hash falso nem propriedade extra. Use uma chave estável por intenção: mesma chave e mesmo corpo em repetição devem recuperar o pedido, enquanto mesma chave com corpo diferente deve conflitar. Não regenerar chave após timeout.

Em modo manual espere PENDING/NOT_SUBMITTED e nenhuma transferência. Salve payment_id. Consultas:

- `GET /payments/{{payment_id}}`: pedido e error_code, quando houver.
- `GET /payments?vault_id={{vault_id}}`: até 100 pedidos recentes, sem simulações.
- `GET /payments?vault_id={{vault_id}}&approval_status=PENDING&limit=100&offset=0`: primeira página da fila; continuar offsets se necessário.

Consulte payment-config de novo para mode_version atual e autorize apenas o pedido de teste desejado:

`POST /payments/{{payment_id}}/approve` com `{"expected_mode_version":"{{mode_version}}"}`. O serviço revalida regras, saldo e limites antes do envio. Se essa revalidação de aprovação falhar, retorna erro e conserva o pedido PENDING; não o converte em BLOCKED. Solicitações novas que falham a política após preflight são persistidas BLOCKED. Para recusar um pedido pendente não enviado, `POST /payments/{{payment_id}}/reject` com `{}`.

Espere até CONFIRMED e confira assinatura na Solana Explorer Devnet com transação finalizada, origem, destino e valor certos. SUBMITTED/UNKNOWN mantêm reservas e não comprovam falha. Não prometa estorno automático por falta de confirmação; a recuperação acompanha o resultado e conserva bytes assinados.

Após bloqueio terminal comprovado, corrigir limite não muda o pedido antigo. Uma solicitação nova deve ter **nova idempotency_key**, identificada como nova intenção, somente após conferir que a anterior não foi enviada. O formulário web diferencia intenção por campos/finalidade e pode recuperar o bloqueio antigo se todos permanecem iguais. Não aplicar esse procedimento a pedido enviado/incerto.

## 7. Automação externa: credencial de agente

O responsável autenticado pode usar `POST /agents/{{agent_id}}/credentials` com `{"ttl_seconds":3600}`. O token retornado uma única vez é segredo: armazenar no serviço externo, não em código/prints/documentação. A UI não entrega essa credencial por Quick Deploy.

O agente externo envia o mesmo corpo de pagamento para **`POST /api/agent-payments`**, com `Authorization: Bearer <token>` e JSON, sem cookie de responsável. Requests de máquina sem Origin e Cookie têm tratamento próprio; requests com cabeçalhos de navegador exigem proteção Origin/CSRF. A credencial deve corresponder ao agente, ter prazo válido e não estar revogada.

Revogação: responsável usa `DELETE /agents/{{agent_id}}/credentials/{{credential_id}}`. Não há pacote `@agentsafe/sdk` publicado comprovado neste repositório; exemplos HTTP usam a API direta.

## 8. Pausar, reativar, conferir isolamento

- `PATCH /agents/{{agent_id}}` com `{"status":"FROZEN"}`: bloquear nova solicitação.
- `PATCH /agents/{{agent_id}}` com `{"status":"ACTIVE"}`: reativar para **nova** solicitação, sem enviar pedido bloqueado antigo.
- `POST /agents/panic` com `{}`: congelar agentes da carteira autenticada. Pagamentos já enviados continuam exigindo conciliação.
- `GET /agents/{{agent_id}}/history`: transações/eventos do agente. Não há GET `/transactions` implementado nesse router; use pagamentos/histórico atuais.
- Login de segunda carteira, em cookie jar separado: IDs privados da primeira devem retornar 404, e listagens não devem misturar dados.
- `POST /auth/logout` com `{}`: encerrar; consulta privada posterior deve retornar 401.

`POST /api/transactions` continua retornando 501 para caminho legado. Withdraw também está indisponível. Não usar essas rotas como demonstração do executor.

## 9. Registrar evidência

| Cenário | Esperado | Resultado real | Evidência | Estado |
|---|---|---|---|---|
| Login e isolamento | Sessão correta / dados separados | A preencher | HTTP e ID público | Não executado |
| Simulação | Aprovação/bloqueios e NOT_SUBMITTED | A preencher | request_id/reason | Não executado |
| Pagamento pequeno | Confirmed e finalized | A preencher | ID/assinatura pública | Não executado |
| Pausa/reativação | Bloqueio e novo pedido elegível | A preencher | IDs e status | Não executado |

Registre revisão, ambiente, data/hora e esperado/obtido. Diferencie Passou, Falhou, Bloqueado por ambiente e Não executado. Para HTTP 500, consulte logs da instalação do horário correto; para 429, respeite janela. Acesso ao site não comprova backup, prontidão do banco ou versão da VPS. Endpoints `/healthz` e `/readyz` precisam responder JSON correto do backend; HTML SPA com 200 não prova prontidão.

Contrato completo e limites: [API REST](api/REST_API.md). Evidências automatizadas/históricas: [PAYMENT_QA.md](PAYMENT_QA.md). Esta documentação não declara que uma carteira real ou transferência externa foram testadas hoje.
