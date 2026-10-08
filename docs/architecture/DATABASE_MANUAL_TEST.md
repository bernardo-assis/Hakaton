# Validação do banco e roteiro manual futuro

## O que pode ser validado agora

Usar SQLite >= 3.38. O schema inicial não migra dados existentes. O schema pode ser aplicado a um SQLite temporário; não usar arquivo com fundos ou dados existentes. Executar, na raiz do projeto, `python3 -m unittest discover -s backend/tests -p test_schema.py -v` e registrar a saída real. Aplicar o DDL em conexão com foreign keys habilitadas e verificar:

1. Inserção válida de um cofre, dois agentes, whitelist e credencial.
2. Rejeição de agente sem cofre e destinatário sem agente.
3. Rejeição de valor negativo/zero para pagamento, limites negativos, estados inválidos e booleano diferente de 0/1.
4. Rejeição de whitelist duplicada, chave de idempotência repetida no mesmo agente, hash de credencial repetido e assinatura repetida.
5. Aceitação da mesma chave de idempotência em outro agente.
6. Rejeição de combinações inválidas entre decisão, liquidação, assinatura e reserva, conforme os checks efetivamente presentes no DDL.
7. Preservação do histórico ao tentar excluir um cofre/agente referenciado.
8. Rejeição de exclusão de pagamento, edição/exclusão de auditoria, troca de cofre do agente, alteração do payload original e troca de assinatura/referência já preenchidas. Atualizações legítimas de liquidação continuam permitidas.

Esses testes comprovam restrições locais. Não comprovam autenticação, concorrência do serviço, segurança de custódia ou liquidação Solana.

## Preparação para testar a API quando implementada

Usar exclusivamente Solana Devnet, cofre de teste com pequeno saldo, duas carteiras de proprietário e dois agentes do mesmo cofre. Registrar saldo, horários UTC e limites. Separar uma chave de agente revogada e um destinatário fora da whitelist. Manter logs sem tokens ou chaves privadas.

Os contratos previstos estão em [ARCHITECTURE.md](ARCHITECTURE.md). Os cenários abaixo permanecem pendentes até existirem endpoints e executor reais.

| Passo | Ação | Resultado esperado |
| :--- | :--- | :--- |
| 1 | Assinar desafio válido; repetir assinatura e usar desafio vencido | Apenas a primeira verificação estabelece sessão. Carteira conectada sem assinatura não administra. |
| 2 | Outro proprietário tenta ver/alterar cofre; agente tenta congelar cofre | 403 e ausência de mudança/vazamento. |
| 3 | Criar agente, limites, destinatário e credencial; revogar credencial | Token exibido só na criação; token revogado/expirado recebe 401; eventos administrativos sem segredos. |
| 4 | Enviar `amountLamports` com fração, expoente, zero à esquerda e valor acima do máximo | 400, nenhuma transferência e nenhuma reserva válida. |
| 5 | Pagar valor permitido usando nova chave | Decisão aprovada, reserva visível e confirmação posterior com assinatura real. |
| 6 | Repetir chave/payload; depois mudar o destinatário usando a mesma chave | Mesmo pagamento/assinatura; alteração recebe 409. |
| 7 | Exceder teto individual, diário ou whitelist | Bloqueio local com motivo; nenhuma assinatura e nenhuma transferência. |
| 8 | Disparar simultaneamente dois pagamentos que juntos ultrapassem teto do agente | No máximo o orçamento disponível é reservado; não aprovar ambos. |
| 9 | Dois agentes disputam saldo insuficiente para ambos, incluindo taxas | Reservas conjuntas do cofre não ultrapassam saldo disponível. |
| 10 | Congelar agente e depois cofre; descongelar apenas cofre | Todos bloqueados durante freeze global; agente congelado individualmente continua bloqueado. |
| 11 | Reiniciar após reserva, após persistir assinatura e após enviar antes de gravar resposta | Operação existente é reconciliada; não surge outra transferência. |
| 12 | Simular timeout de RPC e consultar telemetria | Estado `UNKNOWN`, reserva mantida e nenhuma alegação de confirmação. |
| 13 | Reconciliar confirmação e falha comprovada | Confirmação mantém gasto na janela; falha libera apenas o que não foi debitado, tratando taxas. |
| 14 | Avançar relógio de teste além de 24h com confirmado e pendente | Confirmado sai da janela por `reserved_at`; pendente/incerto continua consumindo orçamento. |
| 15 | Congelar durante execução e conferir assinatura na rede | Trabalho ainda cancelável não é enviado; enviado anteriormente não é apresentado como cancelado. |

Conferir saldo e assinatura no explorador Devnet e comparar com valores/reservas locais. Repetir cenário de confirmação seguido de novo pagamento para detectar uso indevido de saldo observado antigo. Usar relógio controlado no ambiente de teste, sem alterar o relógio do computador.

Ao finalizar, registrar data, revisão do código, passos executados, resultados e pendências. Não marcar como aprovado um cenário ainda sem serviço implementado.
