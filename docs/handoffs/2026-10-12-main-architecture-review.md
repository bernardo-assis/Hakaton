# Revisão de arquitetura e contratos de main

**Agente:** 🏛️ @architect — O Guardião, com leitura de backend-dev-guidelines. **Data:** 12/10/2026. **Escopo:** revisão de código e documentação; sem correção de código, commit, troca de branch ou mutação na VPS. Skills lidas fisicamente com `cat`, porque `view_file` e caminhos Windows não existem neste ambiente Linux.

## Base e alcance das evidências

Main examinada: **`1dd108f5675f982fb5fe70d157f78907ad9f13aa`**, extraída em `/tmp/agentsafe-main-review-20261012`. A árvore de trabalho `bernardo` permanece anterior (`dc498eb` na preparação da revisão); documentação atualizada descreve explicitamente main, não uma feature que foi aplicada nessa árvore.

O snapshot atual acrescenta mudança de cofre do agente, controles rápidos/cópia/faucet no painel e agregação de simulações nos gráficos. `agent_pubkey` continua **obrigatório** na criação: não foi tornado opcional. O controle Quick Deploy produz um identificador público aleatório para preencher esse contrato.

As referências abaixo são relativas ao snapshot main; portanto, acrescentar o prefixo `/tmp/agentsafe-main-review-20261012/` para localizar os números de linha exatos. Os resultados da VPS devem ser conciliados com a revisão operacional; código de main e resposta pública saudável não provam equivalência de imagem ou liquidação autenticada.

## Achados por prioridade

| ID | Prioridade | Achado | Evidência |
| --- | --- | --- | --- |
| A1 | Alta, bloqueia aceite financeiro | Mover agente reatribui histórico, orçamento/reserva e origem da fila | `backend/src/repositories/UiRepository.ts:182` e `:205`; `PaymentRepository.ts:140`, `:152`, `:169`, `:172`, `:178` |
| A2 | Alta, bloqueia aceite financeiro | Resolver cofre antes do lock e não revalidar vínculo pode assinar com o cofre anterior após movimento | `backend/src/services/paymentService.ts:175`, `:178`, `:192`, `:194`; `UiRepository.ts:7`, `:182` |
| A3 | Média, clareza de demo/erro | Histórico não apresenta motivo do bloqueio; replay aparece como “Request recorded: Blocked” em status verde | `frontend/src/components/DevnetPayments.tsx:148`, `:243`, `:401`, `:410`; `frontend/src/lib/payments.ts:70` |
| A4 | Média, fidelidade do pitch | Landing promete previsão/multisig/compliance contínuo que o código não entrega | `frontend/src/components/Features.tsx:15`, `:22`, `:30`; `Solutions.tsx:114`; backend sem LLM/contrato multisig |
| A5 | Média, métricas | Contagens/gráfico unem simulação com pedidos financeiros, sem representar liquidação finalizada | `UiRepository.ts:103`, `:114`; `backend/src/services/uiService.ts:94` |
| A6 | Média, precisa teste de contenção | Movimento adquire locks origem→destino sem ordem global e usando vínculo lido antes do lock; operações concorrentes podem esperar/inverter ordem | `UiRepository.ts:7`, `:170`, `:192`; panic em `:267`; timeout SQL em `backend/src/db/database.ts:14` |

### A1 — Origem financeira não é imutável

`transactions` guarda `agent_id`; `PaymentRepository` calcula origem, uso, listagens, detalhes e recuperação via `agents.vault_id` **atual**. O novo PATCH permite trocar esse vínculo sem verificar pagamentos ou fila. A validação de propriedade do destino impede mover para cofre alheio, mas não preserva histórico ou autoridade original entre cofres do mesmo dono.

Consequências: gastos confirmados deixam de contar no teto do cofre pagador e passam ao destino; reservas UNKNOWN e fila também passam a ser associadas ao destino; uma aprovação humana feita após mover passa a preparar pagamento com o signer novo. A assinatura persistida de pedido enviado ainda é do cofre original, embora recuperação considere políticas/saldo/lock do atual. Não é uma vulnerabilidade de proprietário cruzado comprovada; é quebra das garantias financeiras por cofre.

**Reprodução confirmada em PostgreSQL descartável, RPC totalmente simulado:**

1. Criar cofres A e B do mesmo proprietário e agente em A; pagamento 10000 lamports, taxa 5000, confirmado pelo signer A.
2. Config A informa gasto 15000; mudar agente para B retorna 200.
3. Config A passa a 0, B a 15000; detalhe do pagamento passa a reportar B.
4. Em B/MANUAL criar pedido 20000; mudar agente para A. A fila de B perde o pedido, A passa a exibi-lo e a aprovação usa signer A.

**Critério MVP:** rejeitar movimentos incompatíveis de agentes com pedidos/histórico e tratar concorrência, ou persistir `vault_id` original imutável por pagamento (migração preservando registros, origem de reservas/fees, fila e recuperação). Uma aprovação nunca pode trocar o cofre debitado sem intenção explícita e rastreável. Testar CONFIRMED, FAILED com taxa, PENDING e UNKNOWN. Credenciais existentes também precisam de política explícita de escopo/revogação se agente for movido.

### A2 — Corrida movimento/envio

O serviço busca ID do cofre antes de adquirir advisory lock e depois busca o agente. Com o novo recurso, o agente pode mudar entre essas operações. `validate()` recebe cofre e agente sem verificar que `a.vault_id === v.id`; portanto aplica regras/assina com cofre antigo e grava transação que os joins atribuem ao novo.

**Reprodução determinística confirmada:** interceptar lookup do cofre A, concluir PATCH para B antes de devolver ID A, continuar `/payments`. A API retorna 200/CONFIRMED, o mock de prepare registra signer A, o detalhe reporta B. O teste simula essa intercalação exata com chamadas HTTP reais ao app e PostgreSQL, sem RPC real.

**Critério MVP:** descobrir, adquirir locks e revalidar vínculo antes de qualquer assinatura/despacho; abortar/repetir de forma segura se vínculo mudar. Aplicar a disciplina em pedidos, aprovação, recuperação, whitelist/panic e mutações. Locks múltiplos em ordem determinística e revalidação evitam A6. Adicionar regressão de dois movimentos opostos e movimento concorrente com panic/pagamento, verificando ausência de envio cruzado ou contagem perdida. A6 é análise estática; deadlock específico não foi executado/reproduzido nesta revisão.

### A3 — Pedido registrado não significa pago

Na primeira tentativa bloqueada o backend persiste decisão e retorna 409. A intenção local fica salva. Depois de corrigir o teto, replay com mesma chave retorna a decisão original em 200. O painel então limpa formulário/intenção e mostra mensagem verde de registro bloqueado; `Payment history` exibe rótulo sem `error_code`. Esse comportamento explica a sequência apresentada pelo usuário; não comprova saldo gasto.

**Critério:** mostrar reason/error_code em linguagem clara no histórico, distinguir registro de envio e permitir nova intenção após bloqueio definitivo sem trocar a chave de uma operação incerta. Conservar prova de pagamento único nos testes. Atualmente usar o erro inicial/registro da API e confirmar status antes de tentar de novo.

### A4/A5 — O que apresentar à banca

Implementado: controle determinístico de políticas, owner login, machine token, cofre custodial de Devnet, executor automático/manual, auditoria, painel/simulador, recuperação. Não implementado: um modelo IA autônomo incorporado, previsões, multisig, garantias legais de compliance, contrato de proteção on-chain, planos cobrados ou SDK distribuído.

**Critério:** revisar copy e docs exibidas dentro do app para descrever apenas entregas verificáveis. Chamar os botões de simulação e dizer quando um pedido transferiu de fato. O gráfico deve explicitar eventos/políticas ou separar simulação de pagamento, e distinguir decisão de status finalizado. Não precisa adicionar um LLM ao MVP se o escopo é a infraestrutura de controle para clientes externos.

## Proteções existentes verificadas no código

- Desafio consumido e sessão criada atomically no PostgreSQL, TTL/browser/origin/Ed25519, cookie HttpOnly, guard de origem/CSRF e consultas com user+owner.
- Signer por cofre cifrado AES-GCM com AAD UUID, chave base64 de 32 bytes, genesis Devnet conferido; antigo signer global inacessível por POST `/transactions` (501).
- Dinheiro inteiro, idempotência normalizada, políticas/teto individual/compartilhado e taxa, reserva antes do broadcast, assinatura/bytes persistidos, finalização com verificação de mensagem esperada.
- UNKNOWN conserva reserva; recovery mantém assinatura e consulta finalização mesmo com controles congelados, sem reassinar; credencial/políticas atuais limitam rebroadcast.
- Manual→automatic não libera fila antiga, versionamento de modo/cap e owner-only emissão/revogação de credenciais.
- Migrações versionadas, health/readiness, headers e erros fixos, limites separados para polling/mutações.

Essas proteções são afetadas pela origem mutável descrita em A1/A2; presença do mecanismo não autoriza declarar o ciclo combinado correto.

## Testes desta revisão

O coordenador reportou **13 suites / 109 testes** existentes de main e build de produção aprovados no banco descartável. A suíte nova de main cobre movimentação de agente **sem pagamentos** e propriedade do destino; não cobre origem imutável com histórico.

Prova pontual executada: `/tmp/agentsafe-main-review-20261012/backend/src/__tests__/reviewVaultReassignment.test.ts`, **3/3 casos reproduzidos**. Primeiro houve erro de tipagem no teste auxiliar (`this` sem anotação); corrigido somente no arquivo temporário, depois suite aprovada. As expectativas capturam o comportamento incorreto atual: seu PASS significa reprodução, não aceite da feature.

```bash
docker run --rm --network hakaton_default \
  -v /tmp/agentsafe-main-review-20261012/backend:/app \
  -v agentsafe_backend_modules:/app/node_modules:ro -w /app \
  -e DATABASE_URL=postgresql://review:review-only-nonprod@agentsafe-main-review-db:5432/review \
  -e AUTH_ALLOWED_ORIGINS=http://localhost:5173 -e NODE_ENV=test \
  node:22-alpine npm test -- --runInBand \
  --runTestsByPath src/__tests__/reviewVaultReassignment.test.ts
```

A senha acima é fictícia do banco descartável dedicado à revisão, não credencial da aplicação/VPS. A fixture gera identidade própria e limpa apenas seus registros. Nenhum worker foi iniciado, nenhum faucet/pagamento externo foi chamado e nenhuma carteira do usuário foi alterada.

## Entrega documental e próximos passos

Atualizados `ARCHITECTURE.md` (SQLite/contratos futuros substituídos pela arquitetura PostgreSQL atual), `REST_API.md` (novos campos/defaults/replay/riscos), `UI_API_CONTRACT.md` (login/autoridade/estados e controles main) e `PAYMENT_BACKEND.md` (migração versionada e ressalvas da nova associação). Documentos de QA antigos permanecem históricos, com data e evidência própria.

Antes de considerar finalizado: corrigir A1/A2; provar o fluxo Phantom/Devnet finalizado no ambiente correto; identificar commit/imagem da VPS e backups; resolver feedback e claims da demo; validar caminho mobile/teclado e condições de erro. A revisão de infraestrutura pública/VPS e acessibilidade é complementada pelos agentes responsáveis e não é substituída por este documento.

Melhorias opcionais depois do aceite: LLM externo demonstrativo, SDK publicado, SPL assets, mainnet, contrato/multisig, cobrança de planos, telemetria/alertas centralizados e withdrawal. Não confundir esses incrementos com ausência de autenticação ou executor já implementados.
