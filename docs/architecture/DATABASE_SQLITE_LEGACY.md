# Banco de dados — AgentSafe

## Estado e fonte de verdade

O DDL versionado está em [`backend/src/db/schema.sql`](../../backend/src/db/schema.sql). Este documento descreve o contrato a implementar. A existência do schema não significa que os serviços, autenticação, executor ou recuperação estejam prontos. O schema inicial exige SQLite >= 3.38 (tabelas `STRICT`) e aplicação em banco novo; não é uma migração para dados existentes. SQLite é adequado ao MVP local Devnet com um executor controlado; o desenho não valida custódia de fundos reais.

## Entidades

| Tabela | Finalidade e campos essenciais |
| :--- | :--- |
| `vaults` | Dono (`owner_pubkey`), endereço (`vault_pubkey`), referência protegida da chave (`key_reference`) e status `ACTIVE`/`FROZEN`. Sem chave privada em claro. |
| `agents` | Cofre, identidade pública, nome/papel, status, limites `daily_cap_lamports` e `single_tx_cap_lamports`, whitelist habilitada. |
| `whitelist_recipients` | Endereço e nome do destinatário, único por agente. |
| `transactions` | Valor, taxa reservada, decisão, liquidação, chave de idempotência e hash do pedido, assinatura e referência durável da transação assinada, datas de reserva/envio/confirmação/resolução. |
| `audit_events` | Cofre, ator, ação, alvo, motivo, estado anterior/posterior e data; alterações de limites, whitelist, credenciais e congelamento. |
| `agent_credentials` | Hash de token, escopo, agente, expiração e revogação. Token bruto revelado uma única vez; nunca gravado em auditoria. |

Autenticação do proprietário por desafio assinado é uma dependência ainda aberta. Definir armazenamento e consumo único de desafios e sessões, expiração e revogação antes de implementar as rotas administrativas. `owner_pubkey` apenas identifica o dono. Não é prova de autenticação.

## Valores, datas e integridade

- Valores e taxas são inteiros em lamports. Limites aceitam zero; pagamentos exigem valor positivo. O contrato HTTP usa strings decimais canônicas e máximo `9007199254740991`, validadas com `BigInt`. Não aceitar frações, sinal, zeros à esquerda ou expoentes.
- O intervalo limita conversões seguras para bibliotecas JavaScript. Somatórios de múltiplas linhas também precisam preservar precisão: usar leitura de inteiros como `BigInt` ou acumulação verificada, evitando conversão implícita insegura e overflow do SQLite.
- Datas são epoch UTC em segundos inteiros. A janela de 24 horas usa `reserved_at`, e não uma virada de dia local.
- Cada conexão precisa habilitar `PRAGMA foreign_keys = ON`. Índices cobrem agente/cofre, orçamento e histórico. Unicidade cobre destinatário por agente, chave de idempotência por agente, hash de token e assinatura preenchida.
- Triggers impedem exclusão de pagamentos, alteração/exclusão de eventos de auditoria, mudança do cofre de um agente e alteração da identidade original do pagamento. Assinatura e referência assinada tornam-se imutáveis depois de preenchidas. Isso protege contra alterações SQL usuais; não torna o arquivo inviolável para alguém com controle do banco.
- Histórico financeiro não deve desaparecer por exclusão em cascata. Identidades públicas são validadas na aplicação; `TEXT NOT NULL` não valida Base58 nem prova posse de carteira.
- Não registrar segredo, token ou bytes sensíveis em `before_json`/`after_json`, erros ou telemetria. `key_reference` e `signed_transaction_reference` apontam para armazenamento durável protegido e com acesso restrito ao backend.

## Decisão e liquidação são diferentes

O cofre de uma transação é obtido pelo vínculo `transactions.agent_id → agents.vault_id`. A resposta HTTP pode usar `policyDecision`, mapeado do campo SQL `decision`.

`decision` é `APPROVED` ou `BLOCKED`. `settlement_status` é `NOT_SUBMITTED`, `RESERVED`, `SUBMITTED`, `CONFIRMED`, `FAILED` ou `UNKNOWN`.

| Situação | Decisão | Liquidação | Impacto na reserva |
| :--- | :--- | :--- | :--- |
| Política rejeitada | `BLOCKED` | `NOT_SUBMITTED` | Sem reserva ou assinatura. |
| Política aceita e orçamento reservado | `APPROVED` | `RESERVED` | Reserva valor e taxa. |
| Envio realizado/possível | `APPROVED` | `SUBMITTED` / `UNKNOWN` | Conserva reserva. |
| Confirmação na rede | `APPROVED` | `CONFIRMED` | Valor passa a gasto; saldo observado deve refletir liquidação antes de retirar desconto local. |
| Falha comprovada | `APPROVED` | `FAILED` | Libera valor; tratar taxa efetivamente cobrada pela rede. |

`RESERVED` permite assinatura e referência já persistidas, sem `submitted_at`. Antes da tentativa de envio, persistir `submitted_at` e mudar estado; após queda nesse intervalo, reconciliar a assinatura antes de qualquer liberação. `CONFIRMED` exige `confirmed_at`; `FAILED` exige `resolved_at` e código de erro.

A aplicação deve restringir transições, atualizar timestamps e impedir regressão terminal. Constraints do banco não substituem o protocolo do executor.

## Reserva atômica e orçamento

Dentro de `BEGIN IMMEDIATE`, revalidar dono/vínculo, congelamento global e individual, whitelist, teto por transferência e soma do orçamento. Gravar reserva antes de liberar o lock. Não manter transação SQLite aberta durante RPC.

O gasto computável do agente é a soma de valores em `RESERVED`, `SUBMITTED` e `UNKNOWN` de qualquer idade, mais `CONFIRMED` com `reserved_at` nas últimas 24 horas. As taxas ficam fora dos limites do agente. Reservas nunca expiram automaticamente enquanto o resultado for desconhecido.

O schema não garante teto diário nem saldo disponível por si só: isso depende do serviço transacional e do executor. Serializar o executor por cofre, inclusive após reinício, e relacionar o saldo RPC ao slot/contexto de observação e às assinaturas reconciliadas. Não descontar novamente uma transação cuja saída já está refletida no saldo observado; também não liberar reserva usando saldo anterior à saída.

Para disponibilidade do cofre, considerar valor mais taxa de todas as reservas dos seus agentes. Usar saldo observado com consistência e revalidar imediatamente antes do envio; não reutilizar um saldo antigo para autorizar mais dinheiro após remover uma reserva confirmada. Sincronizar atualizações de saldo e reconciliação sob o mesmo protocolo. Transferências externas e taxas mudam saldo; a reserva local não bloqueia movimentações fora do serviço.

## Idempotência e recuperação após queda

A chave por agente é associada a `request_hash` do payload validado e normalizado. Mesma chave e mesmos parâmetros retorna o registro; alteração de valor/destinatário/propósito retorna conflito. Não incluir segredos no hash. Não executar novamente porque o cliente perdeu a resposta.

Antes do primeiro envio, persistir `solana_signature` e `signed_transaction_reference` recuperável, incluindo bytes assinados, blockhash e validade necessários para reconciliação. A reserva sozinha não resolve uma queda após envio e antes da resposta. O trabalhador recupera a operação existente, consulta a assinatura e, se apropriado, retransmite os mesmos bytes. Não construir outra transação com nova assinatura sem demonstrar que a anterior não liquidou e não poderá liquidar.

Timeout ou falha de consulta vira `UNKNOWN`, mantendo a reserva e apresentando estado incerto ao usuário. Falha definitiva exige evidência da rede/validade e critério documentado de compromisso. Após reiniciar, reconciliar todas as reservas/envios incertos antes de permitir que sejam abandonados. Documentar nível de confirmação exigido na implementação.

## Administração e escopo

Mudanças administrativas e o evento correspondente devem ser gravados na mesma transação local. Freeze do cofre preserva status individuais e bloqueia novos pagamentos de todos os agentes. Unfreeze global não descongela um agente individualmente congelado. Coordenar o corte do executor: transação já transmitida não é cancelável localmente.

As seis tabelas cobrem o núcleo financeiro planejado do MVP; o armazenamento de desafios/sessões de autenticação permanece pendente e pode exigir tabelas adicionais. Organizações, RBAC complexo, fornecedores independentes, múltiplos tokens e fechamento diário ficam para requisitos posteriores. Bloqueios são auditados localmente; não prometer registro onchain desses eventos sem mecanismo adicional.
