# Revisão da modelagem — AgentSafe

Data: 2026-10-08. Escopo: proposta SQL em ARCHITECTURE.md comparada ao PRD; não há schema implementado nem banco disponível para teste neste checkout. Recomendações pendentes de incorporação à arquitetura.

## Parecer

As quatro tabelas cobrem o cadastro básico do MVP, mas ainda não sustentam pagamentos confiáveis e auditoria completa. Corrigir as tabelas existentes é mais urgente que aumentar sua quantidade.

## Correções prioritárias

1. Substituir valores e limites REAL por INTEGER em lamports. Validar montantes positivos, limites não negativos e intervalo seguro na API; usar conversão decimal exata e BigInt quando necessário.
2. Substituir vault_secret_key por referência a armazenamento protegido de chaves. Não guardar a chave privada em texto simples no SQLite nem devolvê-la na telemetria.
3. Separar decisão de política e estado de execução. Registrar pagamentos reservados, enviados, confirmados, falhos e de resultado desconhecido. Uma assinatura recebida não comprova confirmação na rede. Guardar signature única, timestamps e dados necessários à recuperação após reinício.
4. Acrescentar idempotency_key com unicidade por agente e identificação do conteúdo da solicitação. A mesma chave e conteúdo retornam o resultado existente; conteúdo diferente é rejeitado.
5. Fazer verificação do teto e reserva do valor na mesma transação SQLite. Contabilizar reservas em andamento e gastos confirmados. Coordenar também o saldo compartilhado e as taxas por cofre. Não manter transação SQLite aberta durante chamada RPC. Reserva com envio incerto não pode ser liberada só por timeout.
6. Acrescentar status ao cofre para congelamento global. Revalidar congelamento antes do envio; definir que pagamentos já enviados não são cancelados pelo botão de pânico.
7. Documentar autenticação do gestor e do agente. Endereço público e agentId são identificadores, não provas de autorização. Todas as leituras e alterações precisam respeitar o proprietário do cofre.
8. Adicionar UNIQUE(vault_pubkey), UNIQUE(agent_id, recipient_pubkey), CHECK para whitelist 0/1 e valores válidos, NOT NULL explícito nas chaves e timestamps, índices para relações e consulta de gastos por agente/status/data. Habilitar PRAGMA foreign_keys em cada conexão. Preservar histórico ao excluir/desativar cadastros.
9. Definir janela móvel de 24 horas em UTC, instante que inicia o consumo do orçamento e comportamento de reservas pendentes além de 24 horas. Não criar reset à meia-noite se o requisito continuar sendo janela móvel.

## Novas tabelas recomendadas

| Tabela | Prioridade | Finalidade |
| --- | --- | --- |
| audit_events | MVP | Quem alterou limites, whitelist e congelamento; alvo, instante, motivo e valores anteriores/novos, sem segredos. |
| agent_credentials | Condicional ao mecanismo de autenticação | Credenciais revogáveis de agentes, escopo e validade; se usar tokens opacos, armazenar hash. Pode ser dispensada se houver outro mecanismo autenticado com proteção contra replay. |
| auth_challenges / sessions | Condicional à autenticação por carteira | Desafio de uso único e expiração; sessões persistentes se a implementação exigir revogação. Conectar a carteira sozinho não autentica. |
| vault_movements | Evolução ou MVP com extrato de depósitos | Histórico de depósitos, saques e taxas, sem agente obrigatório. Dispensável se o MVP apenas consultar saldo onchain e não prometer extrato desses movimentos. |

Não exigir users, organizations, memberships, tokens ou tabela separada de políticas para uma demo com proprietário identificado por carteira, SOL e limites simples. Essas tabelas passam a fazer sentido quando seus requisitos entrarem no escopo.

## Lacunas nos contratos

O PRD prevê cadastro de agentes, configuração de limites/whitelist e congelamento global, mas os contratos atuais só descrevem pagamento, pânico individual e telemetria. Precisam ser especificados antes da implementação. Bloqueios locais não têm prova onchain no desenho atual; ajustar a promessa do PRD ou projetar publicação explícita desses eventos.

## Validação necessária na implementação

- Duas requisições simultâneas não excedem o teto nem o saldo compartilhado.
- Repetir a solicitação após timeout não produz novo pagamento.
- Reinício após envio permite conciliar a mesma assinatura sem pagamento duplicado.
- Falha confirmada libera reserva; resultado desconhecido permanece em conciliação.
- Congelamento global bloqueia novos envios e acesso entre proprietários é rejeitado.
- Valores inválidos, whitelist duplicada e referências inexistentes são rejeitados.

## Referências técnicas

- SQLite, precisão numérica: https://www.sqlite.org/floatingpoint.html
- SQLite, chaves estrangeiras: https://www.sqlite.org/foreignkeys.html
- Solana, envio versus confirmação: https://solana.com/docs/rpc/http/sendtransaction
