# Plano de fechamento do fluxo de pagamentos Devnet

Data: 2026-10-09. Estado: proposta revisável, sem implementação nesta etapa.
Passagem de bastão: [concepção](../handoffs/2026-10-09-payment-conception.md).

## Escopo e decisão pendente

Completar os quatro requisitos enviados pelo desenvolvedor: autenticar proprietário pela Phantom; executar SOL real de teste na Devnet; impedir pagamentos duplicados; contabilizar o resultado confirmado. Preservar o design atual e o fluxo frontend → API → PostgreSQL. Não inclui mainnet, tokens SPL, organizações ou entrega automática de serviços externos.

**A implementação de pagamentos depende da escolha explícita de quem assina e de onde os fundos sairão.** Uma assinatura de login identifica o proprietário, mas não autoriza o backend a gastar a carteira Phantom. Não importar sua chave privada, nem reutilizar a treasury global de configuração como carteira de qualquer proprietário.

| Opção | Autoridade e execução | Consequência |
| --- | --- | --- |
| A — Phantom assina cada pagamento | Backend monta transferência; usuário aprova a transação; backend valida e persiste os bytes assinados antes de transmitir | Sem chave do usuário no servidor; cada pagamento exige interação humana, não é robô autônomo |
| B — Cofre separado somente Devnet | Servidor mantém chave própria isolada por cofre, vinculada ao proprietário autenticado; usuário opta explicitamente por financiar esse endereço de teste | Permite demonstração automática; políticas são garantidas pelo backend, não por programa on-chain; servidor custodiante pode tecnicamente mover o saldo desse cofre |

Recomendação para a demonstração de robôs: B, restrita a SOL de teste e opt-in explícito, sem acesso à carteira principal. A é alternativa válida se o usuário preferir aprovar cada envio. Nenhuma opção está aprovada neste documento. Cofres atuais `external-wallet:<pubkey>` apenas observam uma carteira: não representam um signer disponível e não serão convertidos silenciosamente em cofres custodiais.

## O que o código atual comprova

- PostgreSQL em `backend/src/db/migrations/0001_initial_schema.sql`; políticas em `0002_vault_policies.sql`.
- Tabelas de pagamentos possuem unicidade `(agent_id, idempotency_key)`, assinatura única, referência do artefato assinado e estados de liquidação. Isso é estrutura, não prova de recuperação financeira implementada.
- Simulador avalia limites, status, whitelist e políticas; armazena resultados em auditoria e contabiliza orçamento simulado no dia UTC. Não faz reserva de pagamentos reais ou débito on-chain.
- Telas consultam a API. A API local não autentica nem isola proprietários. O onboarding de uma PubKey digitada não prova controle dela.
- `POST /api/transactions` está desabilitado com 501 no controller. `TransactionService` legacy contém envio com treasury global, marca SUBMITTED antes de enviar, não reserva orçamento atomicamente, não persiste assinatura antes do envio e trata exceção como falha. **Não habilitar esse serviço como solução dos requisitos.**
- O faucet Devnet é distinto de pagamentos. Withdraw continua indisponível nesta proposta.

Dizer que o sistema “bloqueia perfeitamente” excede a evidência: há testes de políticas do simulador, mas faltam autenticação, saldo compartilhado, reservas financeiras e recuperação com rede incerta.

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

**Janela proposta:** dia de calendário UTC, consistente com telas atuais. O PRD exige janela móvel de 24 horas e precisa ser alterado ou a implementação deve seguir janela móvel. Não assumir equivalência. Decisão de janela deve ser aprovada antes da migração/implementação financeira. Em qualquer variante, TODAS as reservas ainda pendentes, inclusive de dias anteriores, restringem novos pedidos.

Migrações propostas, preservando dados existentes:

- CHECKs para valores/caps, single <= daily, estados coerentes e montantes dentro da faixa inteira suportada; preservar UNIQUE agente/chave e assinatura.
- Campos da intenção: `vault_id`, `budget_day` ou referência da janela, taxa máxima reservada, blockhash e `last_valid_block_height`, assinatura, hash de mensagem, referência durável dos bytes assinados, número da tentativa controlado, motivo/instantes. Referências/artefatos nunca entram em respostas públicas.
- Reservas de agente/cofre e ledger de consumo/taxa, com chave única por pagamento/tipo de efeito. Pode-se usar somatório transacional de pagamentos em vez de contadores, desde que locks serializem todos os escritores e não haja limite de histórico na consulta.
- Worker de conciliação com lease/claim persistente e índice por status; reinício recupera RESERVED/SUBMITTED/UNKNOWN e confirmações ainda não finalizadas.
- Armazenamento protegido de chave por cofre para opção B, referência no banco; não chave em logs, auditoria, arquivos versionados ou frontend.

Valor do pagamento conta no teto do agente; valor mais taxa conta no teto/saldo do cofre (regra proposta que requer alinhamento no contrato). Reservar taxa conservadora e registrar a taxa real de metadados, inclusive em falhas on-chain. Não modificar o cap para “abater gasto”: cap é a configuração; consumo é um registro separado.

Saldo da Solana é observado, não um saldo fictício decrementar no banco. Registrar snapshot com slot/contexto e conciliar pagamentos para não descontar duas vezes um débito já refletido nesse snapshot. Exclusividade do signer por cofre e reservas serializam saídas controladas; movimentações externas precisam de reconciliação antes de novo envio. RPC indisponível ou saldo não confiável bloqueia novos pagamentos.

## Idempotência, reserva e envio

1. Autenticar e resolver agente/cofre próprio. Normalizar recipient, amount decimal, purpose e rede. Gerar hash canônico no servidor. Request ID nasce uma vez por intenção no cliente e é preservado em retry/reload; um novo ID para cada clique não impede duplo envio. UI desabilita botão pendente, mas essa não é a garantia financeira.
2. Abrir transação curta PostgreSQL; adquirir lock do cofre e depois do agente sempre na mesma ordem. Resolver idempotência pela chave única: mesmo payload retorna registro existente, diferente retorna 409. Concorrência de inserção recupera o registro vencedor sem executar outra vez.
3. Revalidar status, políticas, saldo reconciliado, tetos individual/cofre e totais confirmados mais reservas. Reservar valor/taxa e registrar RESERVED atomicamente. Whitelist/human approval/cap não podem ser bypassados em chamadas diretas da API. Human approval exigida fica bloqueada até fluxo explícito, não equivale automaticamente ao login.
4. Montar somente a transferência esperada e estimar taxa. Antes de enviar, revalidar congelamento/políticas e validade da reserva. Na opção A, validar bytes assinados: remetente, destinatário, valor, fee payer, instruções permitidas e mensagem esperada. Rejeitar instruções extras/substituição do destinatário.
5. Persistir duravelmente bytes assinados, assinatura determinística, blockhash/altura de validade e relação com intenção **ANTES do primeiro envio**. Na opção B assinar com a chave do cofre daquela identidade. Nenhuma rede será chamada com transação sem artefato recuperável.
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

Nenhum desses novos gates está marcado como concluído nesta concepção. Antes de codificar: escolher A/B e esclarecer dia UTC versus janela móvel; validar regra do teto de cofre/taxas. Pagamentos reais permanecem desabilitados enquanto essas decisões não forem incorporadas ao contrato.
