# Plano de fechamento do fluxo de pagamentos Devnet

Data: 2026-10-11. Estado: contrato aprovado para implementação; não comprova pagamentos implementados.
Passagem de bastão: [concepção](../handoffs/2026-10-09-payment-conception.md).

## Escopo e decisão aprovada

O usuário aprovou cofre separado exclusivamente Devnet, execução automática e opção de aprovação manual no painel. Ambos os modos usam o MESMO cofre, saldo, signer e histórico. Phantom autentica o proprietário; não assina cada pagamento nem entrega sua chave privada. Preservar frontend → API → PostgreSQL, SOL de teste e design existente. Não inclui mainnet, tokens SPL ou organizações.

Novo cofre é provisionado explicitamente pelo proprietário autenticado, com endereço exclusivo e signer criptografado. Cofres legados `external-wallet:<pubkey>` continuam observacionais; nunca converter nem substituir seus endereços silenciosamente. Não usar treasury global para vários proprietários.

Modo por cofre: `AUTOMATIC` ou `MANUAL`, com revisão monotônica `payment_mode_version`. Automático→manual faz todos os pedidos ainda não transmitidos exigirem aprovação. Manual→automático NÃO libera a fila: pedidos existentes que requerem aprovação conservam esse requisito. Somente novos pedidos seguem o novo modo. Uma aprovação é vinculada à intenção e versão vigente, auditada e idempotente; nunca ignora frozen, whitelist, saldo, limites ou alterações posteriores de políticas. Mudança de versão invalida autorização de envio anterior ainda não transmitida. Envio já iniciado não pode ser cancelado on-chain; mudança/panic deve compartilhar a disciplina de exclusão por cofre do broadcaster para evitar corrida.

## O que o código atual comprova

- PostgreSQL em `backend/src/db/migrations/0001_initial_schema.sql`; políticas em `0002_vault_policies.sql`.
- Tabelas de pagamentos possuem unicidade `(agent_id, idempotency_key)`, assinatura única, referência do artefato assinado e estados de liquidação. Isso é estrutura, não prova de recuperação financeira implementada.
- Simulador avalia limites, status, whitelist e políticas; armazena resultados em auditoria e contabiliza orçamento simulado no dia UTC. Não faz reserva de pagamentos reais ou débito on-chain.
- Story 04 entregou autenticação por assinatura, sessão e isolamento por usuário/carteira; manter sua cobertura em todas as novas rotas. Login não concede autoridade de pagamento.
- `POST /api/transactions` está desabilitado com 501 no controller. `TransactionService` legacy contém envio com treasury global, marca SUBMITTED antes de enviar, não reserva orçamento atomicamente, não persiste assinatura antes do envio e trata exceção como falha. **Não habilitar esse serviço como solução dos requisitos.**
- O faucet Devnet é distinto de pagamentos. Withdraw continua indisponível nesta proposta.

Dizer que o sistema “bloqueia perfeitamente” excede a evidência: há testes de políticas e identidade, mas faltam saldo compartilhado, reservas financeiras e recuperação com rede incerta.

Documentos históricos precisam de alinhamento durante implementação: `ARCHITECTURE.md` ainda descreve SQLite; produção local atual usa PostgreSQL. `DATABASE.md` diz que BIGINT suporta todo u64, mas PostgreSQL BIGINT é assinado. Fixar faixa máxima aceita, valores positivos e representação decimal em strings; não usar Number em contabilidade.

## Autenticação e isolamento

Fluxo proposto: `POST /api/auth/challenge` emite identificador, nonce aleatório, mensagem canônica, instante e expiração curta (proposta 5 minutos), vinculados à PubKey, domínio/URI esperados e ambiente Devnet. A frase legível afirma que autentica sem transferir fundos. O backend guarda o desafio; não aceita mensagem arbitrária devolvida pelo cliente.

Phantom assina os bytes da mensagem; `POST /api/auth/verify` valida assinatura Ed25519, endereço, mensagem exata, origem, TTL e nonce não consumido. Consumo do nonce e criação de sessão devem ser atômicos; duas verificações concorrentes não criam duas sessões. O desafio é persistido com estado de consumo para sobreviver a reinício. Adotar formato padronizado quando compatível com a integração instalada, sem substituir todo SDK apenas para login. A prova de controle é local e não precisa de transação ou RPC. [Solana: messages and authentication](https://solana.com/docs/frontend/messages-and-auth), [Phantom: sign a message](https://docs.phantom.com/solana/signing-a-message).

Sessão opaca: identificador aleatório no cookie HttpOnly, SameSite apropriado, Secure em HTTPS; exceção de HTTP apenas para desenvolvimento localhost explicitamente configurado. Banco guarda hash do token, proprietário, wallet, expiração e revogação. Restringir CORS à origem conhecida, validar Origin e proteção CSRF nas mutações. Rate limit específico em challenge/verify. `GET /api/auth/session` recupera identidade; logout revoga. Troca de conta/disconnect invalida a sessão antiga e limpa dados exibidos antes de nova autenticação.

Resolver identidade por vínculo único wallet → user no servidor. Não confiar em `user_id`, `owner_pubkey` ou actor enviados pelo cliente. Migração necessária para wallet identities, desafios e sessões; login de carteira não implica implementar email/senha agora. Não criar vínculo automático com contas existentes sem prova correspondente.

Cobertura obrigatória, incluindo caminhos antigos:

| Superfície | Restrição |
| --- | --- |
| `/api/vaults` e `/local` | Listar/criar somente para usuário autenticado; retirar entrada livre `user_id`, `key_reference` e autoridade arbitrária; observar endereço próprio ou provisionar cofre conforme opção escolhida |
| Cofre status/policies/optimize e faucet | Buscar cofre com owner filter antes da operação; erro genérico 404 para objeto não acessível |
| `/api/agents` e whitelist/history | Resolver propriedade via agent → vault → user em consulta/transaction; cadastro só em cofre próprio |
| `/api/agents/panic` | Congelar apenas agentes do proprietário; nunca toda a base |
| Dashboard, chart, transactions, notifications | Agregações e paginação filtradas por proprietário; não filtrar depois de recuperar dados globais |
| Simulator evaluate/history | Mesmo filtro de propriedade; não permite acessar ou gastar orçamento simulado de outra conta |
| `/api/users` legacy | Desativar cadastro aberto com `password_hash` recebido do cliente ou substituir por contrato seguro; não é bypass da identidade por wallet |
| Pagamentos/status/artefatos | Proprietário ou credencial revogável restrita ao agente, sem acesso a chaves, artefatos assinados ou transações alheias |

Sessão do gestor não equivale à credencial do robô. Para cliente autônomo externo, token aleatório com hash no banco, escopo `pay`/`read-own`, TTL/revogação e agente fixo. Autor de auditoria vem dessa identidade autenticada. Pagamentos não recebem `request_hash` confiável do cliente.

## Modelo financeiro e migrações propostas

Definir um teto próprio de cofre, pois hoje o dashboard soma tetos de agentes; essa soma não é um limite independente. Acrescentar `vaults.daily_cap_lamports` validado e editável pelo proprietário. Agente e cofre possuem orçamento separados; simulações nunca entram nos totais reais.

**Janela vigente:** móvel de 24 horas, sem reset à meia-noite. Principal confirmado conta quando `reserved_at >= now() - interval '24 hours'`; reservas ativas/incertas de QUALQUER idade continuam contando. Taxa efetiva também consome teto de cofre, inclusive em falha on-chain; registrar instante de consumo da taxa. Simulações são separadas.

Migrações propostas, preservando dados existentes:

- CHECKs para valores/caps, single <= daily, estados coerentes e montantes dentro da faixa inteira suportada; preservar UNIQUE agente/chave e assinatura.
- Campos da intenção: `vault_id`, `reserved_at` para janela móvel, taxa máxima reservada, blockhash e `last_valid_block_height`, assinatura, hash de mensagem, referência durável dos bytes assinados, número da tentativa controlado, motivo/instantes. Referências/artefatos nunca entram em respostas públicas.
- Reservas de agente/cofre e ledger de consumo/taxa, com chave única por pagamento/tipo de efeito. Pode-se usar somatório transacional de pagamentos em vez de contadores, desde que locks serializem todos os escritores e não haja limite de histórico na consulta.
- Worker de conciliação com lease/claim persistente e índice por status; reinício recupera RESERVED/SUBMITTED/UNKNOWN e confirmações ainda não finalizadas.
- Armazenamento protegido de chave por cofre para opção B, referência no banco; não chave em logs, auditoria, arquivos versionados ou frontend.

Valor do pagamento conta no teto do agente; valor mais taxa conta no teto/saldo do cofre (regra vigente deste contrato). Reservar taxa conservadora e registrar a taxa real de metadados, inclusive em falhas on-chain. Não modificar o cap para “abater gasto”: cap é a configuração; consumo é um registro separado.

Saldo da Solana é observado, não um saldo fictício decrementar no banco. Registrar snapshot com slot/contexto e conciliar pagamentos para não descontar duas vezes um débito já refletido nesse snapshot. Exclusividade do signer por cofre e reservas serializam saídas controladas; movimentações externas precisam de reconciliação antes de novo envio. RPC indisponível ou saldo não confiável bloqueia novos pagamentos.

## Idempotência, reserva e envio

1. Autenticar e resolver agente/cofre próprio. Normalizar recipient, amount decimal, purpose e rede. Gerar hash canônico no servidor. Request ID nasce uma vez por intenção no cliente e é preservado em retry/reload; um novo ID para cada clique não impede duplo envio. UI desabilita botão pendente, mas essa não é a garantia financeira.
2. Abrir transação curta PostgreSQL; adquirir lock do cofre e depois do agente sempre na mesma ordem. Resolver idempotência pela chave única: mesmo payload retorna registro existente, diferente retorna 409. Concorrência de inserção recupera o registro vencedor sem executar outra vez.
3. Revalidar status, políticas, saldo reconciliado, tetos individual/cofre e totais confirmados mais reservas. Reservar valor/taxa e registrar RESERVED atomicamente. Whitelist/human approval/cap não podem ser bypassados em chamadas diretas da API. Human approval exigida fica bloqueada até fluxo explícito, não equivale automaticamente ao login.
4. Montar somente a transferência esperada e estimar taxa. Antes de enviar, revalidar congelamento/políticas e validade da reserva. No modo manual, validar aprovação vigente do responsável; construir internamente somente transferência SOL permitida, sem instruções extras.
5. Persistir duravelmente bytes assinados, assinatura determinística, blockhash/altura de validade e relação com intenção **ANTES do primeiro envio**. Assinar com a chave do cofre separado daquela identidade em ambos os modos. Nenhuma rede será chamada com transação sem artefato recuperável.
6. Enviar os mesmos bytes; registrar SUBMITTED se possível. Retornar 202 pendente e status URL quando não houver confirmação. Exceção/timeout após possível envio muda para UNKNOWN, mantendo reserva.
7. Worker consulta a assinatura, confirma resultado no compromisso definido e efetua reconciliação. Reenvio dentro da validade pode usar somente os mesmos bytes; não gerar outra assinatura por timeout.

Kill switch bloqueia novas autorizações/envios ainda não transmitidos; não cancela uma transação já enviada. Workers devem verificar congelamento imediatamente antes de broadcast, usando disciplina por cofre; promessa de cancelamento on-chain não faz parte do MVP.

## Resultado e atualização exata uma vez

- `CONFIRMED`: exige status de rede apropriado, `err == null`, e verificação do pagamento esperado; registrar assinatura/slot/taxa e converter reserva em consumo em uma transação de banco, com efeito único por payment ID. Estado `confirmed` é confirmação observada, não garantia de finalização absoluta; para liberar efeitos irreversíveis preferir `finalized` e registrar o nível usado.
- `FAILED`: erro on-chain comprovado libera reserva do principal e registra taxa efetivamente cobrada; falha definitivamente anterior ao envio libera tudo. Retry não cria nova intenção silenciosamente.
- `UNKNOWN`: rede sem resposta, status nulo ou timeout não comprovam falha. Manter reserva e consultar novamente, incluindo histórico quando necessário. Expiração do blockhash impede futuro processamento dessa assinatura, mas não prova que ela não foi processada antes; verificar histórico e evidência suficiente antes de liberar. Sem evidência, permanecer pendente para intervenção controlada.
- Reassinatura depois de expiração somente após reconciliação que descarte pagamento anterior e política explícita de nova tentativa. Caminho conservador do MVP: terminar tentativa comprovadamente não processada e exigir nova intenção explícita; nunca reconstruir automaticamente após timeout.
- Crash entre broadcast e update recupera assinatura já persistida; crash após confirmação e antes do ledger repete atualização idempotente, sem novo pagamento.

A documentação Solana orienta considerar validade de blockhash e estado da assinatura no diagnóstico de confirmação. Esse comportamento sustenta a escolha de recuperação acima; o desenho de reserva/ledger é próprio do AgentSafe. [Solana: confirmation and expiration](https://solana.com/developers/cookbook/transactions/confirmation).

## Frontend e contrato público

Manter cores, cards, navegação e layout. Acrescentar apenas status “carteira conectada” versus “autenticada”, recusa/expiração de assinatura, modo SIMULATION/DEVNET e progresso de pagamento. Mostrar valor e destino antes da assinatura/opção automática. Phantom sem suporte/recusa nunca cria sessão falsa.

POST pagamento proposto recebe `{agent_id, recipient_pubkey, amount_lamports, purpose?, request_id}`; autor e hash são derivados no servidor. GET status expõe decisão separada de settlement, reservas, taxa real quando conhecida e link Explorer `?cluster=devnet`. Não expor signer/reference/secret. Frontend atualiza orçamento após status persistido, mantendo pendências visíveis; não “debita” optimisticamente como se confirmado.

Robô comportado deve usar valor pequeno financiado na Devnet e destinatário de teste explícito; guloso excede cap e não produz assinatura de transferência. Simulação continua disponível sem movimentação, separada da demonstração real. Não trocar seus botões para envio de fundos silenciosamente.

## Stories e evidências antes de concluir

Ordem: documentação alinhada e escolha da autoridade/janela → migrações PostgreSQL → autenticação/isolamento → reserva/worker/payment API → frontend → QA. Backend não é liberado para enviar antes dos testes de autorização e concorrência. No MVP, impedir mainnet por configuração e identidade do cluster; falhar fechado se não comprovadamente Devnet. Faucet permanece explícito e não é parte do pagamento confirmado do robô.

| Gate | Evidência exigida |
| --- | --- |
| Identidade | Assinatura válida/invalidada, outra PubKey, nonce reusado/expirado, corrida em verify, logout/restart, origem indevida |
| Isolamento | Duas contas: cada rota de leitura/mutação, dashboard, panic, notificações e onboarding não permitem acesso cruzado; agentes credenciados só acessam seu perfil |
| Reserva | Duas requisições diferentes em paralelo no mesmo cofre/agente, dois agentes compartilhando cofre, teto e saldo/taxa exatos, reservas antigas, mudança de política/freeze |
| Idempotência | Mesmo ID/payload em paralelo e depois de reinício gera uma assinatura; payload divergente 409; IDs normalizados corretamente |
| Rede incerta | Timeout depois do broadcast, RPC indisponível, status ausente, expiração, fail comprovado, reinício em cada fronteira, worker concorrente |
| Contabilidade | Confirmação repetida atualiza ledger uma vez; falha contabiliza taxa; cap não é alterado; simulação não consome real; snapshot não causa débito duplo |
| Demo | Phantom extensão real autentica; comportado confirma Devnet com Explorer; guloso bloqueia; panic impede novo envio; orçamento e histórico coincidem |

Nenhum desses novos gates está marcado como concluído nesta concepção. Decisões de autoridade, modo e janela já autorizadas. Pagamentos permanecem desabilitados até implementação e validação dos gates financeiros; não solicitar novamente aprovação da escolha.

## API concreta e persistência — handoff 2026-10-11

Todas as rotas de gestão exigem sessão existente, Origin válido e filtro usuário E carteira; acessos cruzados retornam 404. Valores monetários são strings decimais inteiras positivas, <= 9223372036854775807; totais intermediários em bigint/numeric, sem Number. Bodies estritos e erros públicos sem mensagens internas.

| Método e rota | Corpo / resultado |
| --- | --- |
| POST `/api/vaults/:id/signer` | Provisionamento explícito em cofre novo de teste; gera endereço e signer exclusivo; rejeita conversão silenciosa de legado com endereço observado |
| GET / PATCH `/api/vaults/:id/payment-config` | PATCH `{execution_mode:"AUTOMATIC" ou "MANUAL",expected_version:N,daily_cap_lamports?}`; incrementa versão atomicamente, 409 se divergente; retorna impacto na fila |
| POST `/api/payments` (gestor) / `/api/agent-payments` (Bearer de agente) | `{agent_id,recipient_pubkey,amount_lamports,purpose?,request_id}`; identidade derivada; 202 intenção pendente ou bloqueio persistido, replay retorna mesma intenção, payload divergente 409 |
| GET `/api/payments/:id` | intenção, approval_status, settlement_status, valor/reserva/taxa, assinatura e Explorer Devnet; sem bytes assinados/chaves |
| GET `/api/payments?approval_status=PENDING` | fila paginada do proprietário, sem recursos de outra carteira |
| POST `/api/payments/:id/approve` | `{expected_mode_version:N}`; apenas proprietário, revalida políticas, idempotente para mesma autorização |
| POST `/api/payments/:id/reject` | `{reason?}`; apenas intenção ainda não transmitida, libera reserva se existente, auditado |

`approval_status` independente de settlement: `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED`. Pedido manual aguarda sem reserva financeira e sem artefato assinado; aprovação adquire reserva somente após revalidar tudo. Se modo muda após reserva/assinatura mas antes de broadcast, manter a reserva, invalidar aprovação e exigir nova aprovação. Nunca liberar principal de artefato que possa ter sido transmitido. O GET expõe esta distinção para a UI.

Migração aditiva após migrations existentes: `vaults.signer_kind` default `EXTERNAL_WALLET`, `network` (Devnet no novo signer), `payment_mode` default `MANUAL` para legado, `payment_mode_version`, `daily_cap_lamports`; tabela restrita `vault_signers` com vault único, ciphertext, nonce, authentication tag e key version; intents/transactions com approval status/version/actor/time, reserved_at, fee reserve/actual, signed bytes protegidos, signature, blockhash, last valid height, attempted broadcast e lease de conciliação. Guardar mudança de modo e aprovação em audit_events. Preservar tabelas/IDs/registros existentes; migração não cria signer nem ativa pagamentos em legado.

AES-256-GCM ou equivalente autenticado, chave mestre `DEVNET_SIGNER_MASTER_KEY` obrigatória fornecida por ambiente/secret manager, nunca versionada. Nonce aleatório por cifragem e AAD vinculado ao cofre/rede/versão. Ausência de chave ou falha de decifragem bloqueia provisioning/envio; nunca criar chave temporária ao reiniciar. A chave do signer não é retornada nem registrada em log. Validar a identidade Devnet do RPC antes de qualquer assinatura/envio, falhando fechado. Testes usam adaptador determinístico e PostgreSQL real, sem fundos/network automaticamente.

Locks sempre cofre→agente; requests, aprovação, modo, panic e claims devem respeitar essa disciplina. Serialização de broadcast precisa abarcar última revalidação e início de envio, sem manter transação SQL aberta durante RPC: mutex/lease por cofre compartilhado por TODOS os processos, com fencing e verificação de versão. Um lease que expira não comprova não-envio; recover usando assinatura/bytes persistidos. Caso não haja esse mecanismo no MVP, limitar explicitamente a um broadcaster e gestão serializada, sem alegar suporte multi-worker.

Credenciais: POST `/api/agents/:id/credentials` entrega token uma única vez ao proprietário, persiste somente hash/escopo/TTL; DELETE `/api/agents/:id/credentials/:credentialId` revoga com owner filter. `/api/agent-payments` aceita somente credencial de agente fixa, resolve agente no servidor e não depende de sessão wallet; CORS/Origin browser continuam restritos quando presentes. Nomenclatura pública `execution_mode` corresponde a `payment_mode` no modelo conceitual.
