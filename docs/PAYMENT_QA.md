# QA independente de pagamentos — 2026-10-11

## Integrated release validation

After preserving the local payment delivery and integrating dev-jotaf77057a1, the combined release passed42 backend tests in11 suites and14 frontend tests, with successful builds. Financial Chromium checks used API fixtures; authentication Chromium checks ran against the new Docker API at8088 using two generated Ed25519 keys, without real Phantom or funds. Session cookies, restoration, switching and logout passed; both generated wallet fixtures were explicitly removed. Docker services, persistent secrets, migration history and data survived container recreation. Deployment/configuration evidence is recorded in `DEPLOYMENT.md` and story06. Real hosted HTTPS and a funded finalized Devnet payment remain unverified.

Revisão preparatória e regressões executadas por agente de contrato/QA delegado. Skills QA e Security lidas fisicamente via terminal. Nenhum envio real ou fundos de teste utilizados; PostgreSQL real com fixtures próprias e adaptador de rede determinístico. Somente `backend/src/__tests__/paymentSafety.test.ts` foi editado como código nesta delegação.

## Evidência executada

Comando: `docker exec agentsafe_backend_local npm test -- --runInBand src/__tests__/paymentSafety.test.ts`.

RED inicial: 5 falhas / 2 passes. Reproduziu taxa indevida no teto de agente, saldo confirmado descontado novamente, aprovação ignorando versão antiga e ausência do limite independente de cofre no schema. Os casos de teto cofre/taxa antiga inicialmente falharam por schema ausente; após migração passaram a verificar comportamento financeiro.

GREEN final desta revisão: 9/9 testes, uma suíte, exit 0, 3.582 s. PostgreSQL real; limpeza exclusiva por users UUID das fixtures.

| Garantia verificada | Evidência |
| --- | --- |
| Agente usa principal; cofre principal + taxa | Pedido no teto exato agente confirma; teto menor que total do cofre bloqueia |
| Saldo confirmado sem desconto duplicado | Segundo pagamento usando saldo RPC já debitado confirma |
| Pendência incerta de qualquer idade reserva | UNKNOWN com reserved_at de 48h bloqueia estouro de cap |
| Taxa de falha recente não some por reserva antiga | FAILED resolvido hoje com reserva48h restringe teto cofre |
| Aprovação versionada e replay | Versão antiga retorna409 sem enviar; versão atual envia uma vez; replay não reenvia |
| Isolamento proprietário e carteira | Outra carteira do mesmo user recebe404 config/approve/reject e list vazia |
| Panic serializado com broadcaster | RPC send retido; pg_locks comprova panic esperando advisory lock; após envio panic congela e próximo pedido não envia |
| RPC fora de transação SQL | Instrumentação de BEGIN/COMMIT observa guard/balance/prepare/send/status sem transação aberta |

## Revisão estática final

API de detalhe por ID tem owner filter usuário E carteira, artefatos assinados e request_hash removidos da resposta. payment-config expõe cap cofre e atualização versionada. Gestão mantém sessão e Origin/CSRF; exceção para máquina é delimitada a `/api/agent-payments` sem cookies/origin, exigindo Bearer escopado. Mutation de policies/status, whitelist, simulação e panic compartilham advisory locks com envio; panic de múltiplos cofres ordena locks por ID. Signer cifrado AES-GCM vinculado ao vault, chave externa obrigatória; cofre legado continua sem signer.

Adapter exige genesis Devnet, assinatura válida e mensagem exatamente igual aos bytes persistidos, finalized e coerência dos erros meta/status. Essas propriedades foram inspecionadas, não comprovadas por esta suíte de rede mockada.

## Pendências da revisão (não representam aprovação final)

- Na revisão de server.ts, não havia worker runtime chamando `reconcile`: serviço/testes isolados não garantem recuperação automática após reinício. Backend informado para corrigir e fornecer evidência.
- Reconciliador consulta os primeiros100 por created_at: 100 UNKNOWN permanentes podem impedir os demais de conciliar. Exige fila justa/cursor/last_checked ou varredura integral paginada.
- Lista pública retorna somente os100 mais recentes; detalhe por ID recupera pedido conhecido, mas não substitui descoberta paginada de pendências antigas. Adicionar filtro PENDING/paginação ou garantir fila completa no painel.
- Testes desta delegação não exercitam adapter RPC real, mainnet guard, mismatch de mensagem/assinatura e expiração do blockhash. Não declarar essas propriedades testadas só por mocks de PaymentNetwork.
- UNKNOWN expirado sem prova suficiente continua reservado; requer comunicação clara e procedimento de conciliação/intervenção. Isso é comportamento conservador, não falha comprovada.
- Interface, browser real, Phantom real, Devnet Explorer e recuperação do processo completo permanecem gates posteriores.

Backend relatou 34 testes em8 suítes; esse número é relato do agente backend e não execução independente desta delegação. Não houve commit/push.

## Atualização após correções do reviewer

Server runtime agora cria PaymentService quando enabled, executa reconcile na inicialização e a cada15s, com guarda contra sobreposição no mesmo processo. Lista pública agora aceita filtros e paginação; cap config retorna totais. Isso corrige os dois achados de integração citados acima, após inspeção estática; não foi testado reinício físico por esta delegação.

Execução independente adicional: `docker exec agentsafe_backend_local node tests/payment_network.test.cjs` → exit0, PASS. Usa Solana Keypair/Transaction reais e RPC injetado: assinatura Ed25519 válida, fee payer esperado, confirmação com bytes correspondentes, rejeição de bytes divergentes e genesis mainnet rejeitado. Nenhum envio de rede. Expiração/canResend e recuperação física após restart ainda precisam de evidência própria.

Ainda pendente no instante desta atualização: fairness de conciliação oldest100 UNKNOWN; backend está corrigindo. Registro acima preserva achados originais e esta seção esclarece o estado posterior.

## Estado posterior — gate backend concluído

Backend entregou `paymentRecoveryQueue.test.ts`, com tabelas temporárias PostgreSQL isoladas e 101 pendências, comprovando distribuição da fila em lotes sem bloquear os pedidos seguintes. Validação final reportada pelo responsável: 39 testes em nove suítes, build e diff-check aprovados. Runtime reiniciado, HTTP 200 e genesis Devnet verificados. Configuração local habilitada com chave externa ao Git e permissão 0600; nenhuma pendência financeira antes/depois e nenhum fundo movimentado. A prova end-to-end com transferência finalizada na Devnet continua pendente; interface e navegador seguem em validação.

## Revisão frontend preparatória

Inspeção read-only de DevnetPayments.tsx, lib/payments.ts, lib/api.ts e App.tsx. Troca/logout remonta conteúdo por auth.generation; leitura assíncrona protege alive/epoch. Intenção idempotente usa storage com escopo carteira+cofre e payload normalizado; falha preserva key para retry igual. Modos enviam expected_mode_version; aprovação e simulação aparecem separadas.

Achados enviados ao frontend/root: fila de aprovação deve exibir destinatário completo antes do botão (bloqueador de revisão humana); pendências limit100 necessitam paginação para descoberta completa; polling15s não deve sobrescrever limite em edição. São achados da inspeção original, aguardando correções/evidência do frontend. Nenhum teste de browser foi executado por esta delegação; build13 testes é relato de frontend/root, não evidência independente aqui.

## Gate frontend concluído — evidência final do root

Achados de interface corrigidos: destinatário completo aparece na fila e histórico, botão de paginação recupera pendências além100, edição de cap permanece durante polling e estado REJECTED tem rótulo prioritário. Inspeção posterior confirmou esses controles no componente/helper.

Responsável frontend reportou13 testes e build aprovados; lint0 erros/9 warnings. Root executou navegador extended por21s com API mockada: modos/queue/CSRF/UNKNOWN, mobile, fullrecipient, dirtycap após16s, paginação101 e recusa; nenhuma exceção runtime/console. Esta é evidência do root, distinta dos9 testes executados diretamente por esta delegação e do adapter real com RPC injetado.

Estado final técnico: banco/backend/frontend implementados e gates automatizados/browser mockados aprovados. Story05 atualizada com checkboxes que separam código/testes da demonstração financeira. Ainda NÃO realizados: Phantom real nesta entrega, financiamento e pagamento finalizado na Devnet real, recuperação física com pagamento on-chain pendente, gravação de pitch e atualização de cartões externos. Reinício runtime vazio+HTTP200 não equivale a recuperação financeira comprovada. Nenhum envio de fundos efetuado nesta delegação.
