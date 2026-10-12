# Passagem de bastão — documentação do usuário

Data: 12/10/2026. Agente: 📊 O Cartógrafo (@analyst). Escopo aprovado: revisar main/site e explicar operação detalhadamente; nenhuma feature ou alteração do runtime.

## Base e procedimento

Skill lida fisicamente: `/home/bernardo/.codex/skills/aas-analyst/SKILL.md`; instruções locais AGENTS.md lidas. Ferramenta view_file/paths Windows indisponíveis, leitura equivalente por terminal Linux. Fonte executável: snapshot `/tmp/agentsafe-main-review-20261012`, SHA remoto main `1dd108f5675f982fb5fe70d157f78907ad9f13aa`; alterações documentais feitas no workspace bernardo, sem commits/push.

## Entregas

- README inglês com URL informada, hash de revisão, limites da evidência e navegação documental.
- docs/README.md: índice por uso/operação.
- docs/USER_GUIDE_PT.md: endereços, acesso, todas as telas, cadastro, atalhos, políticas, saldo/reservas/limites, estados, erros e critérios de aceite.
- docs/PUBLISHED_APP_MANUAL_TEST_PT.md: fluxo simples financiado 0.01, resultados esperados e tabela não executada.
- docs/UI_MANUAL_TEST.md e PAYMENT_PANEL_MANUAL_TEST.md: critérios atualizados e evidências históricas preservadas como históricas.
- docs/WALLET_AUTH_MANUAL_TEST.md: site/demo, Origin/cookie/CSRF e isolamento.
- docs/manual-test-guide-backend.md: substitui exemplos falsos/legacy por sessão por carteira e executor único; inclui reativação correta após pausa.

## Achados que afetam o usuário

1. Chave do agente é obrigatória no formulário main real, apesar de expectativa de campo facultativo transmitida inicialmente. POST /agents usa AgentController/createAgentSchema; Quick Deploy gera identificador, não credencial/chave privada externa.
2. Quick Deploy cria limites 5/1 e whitelist desativada; não reproduz critérios do guia 1/0.5 até ajustar.
3. Reassociar agente com histórico/fila desloca consultas financeiras ao novo cofre. Guias orientam criar agente novo.
4. Overview gráfico e contadores incluem simulações, enquanto gasto e pagamentos devem ser avaliados separadamente.
5. Histórico não exibe error_code em cartão; motivo exige detalhe API/operador.
6. Após bloqueio terminal, retry com intenção igual pode recuperar pedido antigo; novo teste só após ausência comprovada de envio, com finalidade/identidade nova. SUBMITTED/UNKNOWN nunca são tratados como bloqueio terminal.
7. Seletores topo/DevnetPayments independentes e link Open Agent Fleet em /agents não é rota implementada por App.

## Validação e aceite

Revisão documental contra componentes, routers, controllers, schema e serviços do snapshot; check de links locais. Não houve operações financeiras/externas nem acesso administrativo VPS por este agente. QA automatizado executado pela equipe deve ser registrado no relatório raiz com seu ambiente; não confirma extensão Phantom real nem pagamento finalizado.

Lição a incorporar em AGENTS.md pelo Maestro: título do commit não prova contrato; rastrear o router ativo, distinguir Quick Deploy de formulário regular e preservar a identidade de tentativa após bloqueio/incerteza. Realocação com histórico financeiro não é seleção visual.

## Continuação — roteiro único para banca

Solicitação adicional consolidada em `docs/JUDGES_GUIDE.md` (inglês), independente de leitura de outros documentos. Entrada prioritária no README/índice; resultados esperados versus registro real, três endereços A/B/C, Quick Deploy e whitelist explicitados, nenhuma quarta carteira obrigatória. Mantém limites de evidência e risco financeiro aberto.
