# Guia de teste das telas

Revisado em 12/10/2026 para remoto `main` (`1dd108f`). Os cenários são critérios de aceite, não resultados de execução na VPS. Leia o [guia de campos/botões](USER_GUIDE_PT.md) e o [roteiro publicado](PUBLISHED_APP_MANUAL_TEST_PT.md) antes de começar.

## Ambiente

- Publicado, informado pelo responsável: https://agentsafe.kernellabs.uk/.
- Demo Docker isolada: `./scripts/demo.sh up`, depois http://localhost:8088; detalhes em [DEPLOYMENT.md](DEPLOYMENT.md).
- Ambiente de desenvolvimento já preparado neste computador: http://localhost:5173, containers `agentsafe_pg`, `agentsafe_backend_local` e `agentsafe_frontend_local`. Esse ambiente pode estar em outra revisão; não o confunda com main/VPS.

Para iniciar o ambiente preparado:

```bash
docker start agentsafe_pg
docker exec agentsafe_pg pg_isready -U agentsafe -d agentsafe_db
docker start agentsafe_backend_local agentsafe_frontend_local
```

Aguarde o banco aceitar conexões. Confira logs e HTTP antes de afirmar que abriu. O proxy Docker precisa apontar para `http://agentsafe_backend_local:3001` na mesma rede; alteração de `.env.local` exige reinício do frontend. Não execute `backend/setup.js`: o runtime usa migrações PostgreSQL versionadas. Não interrompa serviços da VPS para testar um estado de falha.

## 1. Landing e login

1. Confira texto, vídeo de fundo, navegação, CTA **Launch App** e **Docs** em desktop e largura de 390 px.
2. Docs deve abrir sem autenticação. Launch App deve abrir acesso por Phantom e ocultar dados privados antes de assinatura verificada.
3. Recuse conexão/assinatura; não deve aparecer login fictício. Sem extensão, deve haver orientação.
4. Faça login e teste restauração, troca de conta e logout seguindo [WALLET_AUTH_MANUAL_TEST.md](WALLET_AUTH_MANUAL_TEST.md).
5. Avalie correspondência de depoimentos/preços/promessas da landing com evidência real de negócio; não assuma que texto de marketing está validado.

## 2. Overview e header

1. Em conta de teste vazia, verifique estado vazio e ausência de registros fictícios. `Unavailable` deve representar saldo não obtido, sem simular sucesso.
2. Após cadastro, compare cofres/agentes com a API `/api`; nenhuma persistência deve acessar banco diretamente do navegador.
3. Pesquise ID/nome real e depois texto inexistente; teste filtro e seleção de linhas. Seleção é local, sem apagar/aprovar pagamentos.
4. Confira sino de notificações com eventos reais/estado vazio; deve desaparecer informação da carteira anterior ao trocar de conta.
5. Deposit SOL: escolha cofre, tente valor vazio, zero, negativo e inválido. Faucet pode falhar; não mostrar saldo inventado. Use alternativa oficial do guia publicado.
6. Withdraw Funds → Check Availability: esperado caminho indisponível, sem transferência; pagamentos reais do protótipo estão em Devnet Payments.
7. Contador de bloqueios e gráfico incluem avaliações do simulador no main. Confirmed spending e Recent Transactions seguem pagamentos: não equiparar aprovação a transferência.

## 3. Agent Fleet

1. Crie agente no cofre correto, com chave pública válida, nome e finalidade; teto diário `1`, por operação `0.5`, whitelist ativada e destinatário real de teste.
2. Salve e recarregue: persistência de identidade/limites/lista. Edit Limits abre os campos de configuração; chave pública fica bloqueada na edição.
3. Teste busca, status e ordenação. Pause → FROZEN → nova solicitação bloqueada; Resume → ACTIVE → nova solicitação válida. Resume não dispara pedidos bloqueados antigos.
4. Teste valores inválidos, teto por operação acima do diário e endereço inválido; não criar configuração parcial silenciosa. Se agente salvou mas whitelist falhou, o editor deve permitir completar a lista com erro explícito.
5. Teste emergência numa conta de teste: somente agentes da carteira autenticada congelados; a conciliação dos enviados continua.
6. No Devnet Payments, Quick Deploy cria agente no cofre com `5`/`1` SOL e whitelist desativada. Edite para obter os critérios do passo 1. Não mover agente com histórico usando Other agents: risco de atribuição financeira ao novo cofre identificado na revisão.

## 4. AI Simulator

1. Sem agente, confira orientação. Com agente permitido, ligue Start/Stop e avalie `0.5`: `APPROVED / POLICY_PASSED`, `SIMULATION / NOT_SUBMITTED`.
2. Avalie `6`: `SINGLE_TX_CAP_EXCEEDED`; outro destino válido: `RECIPIENT_NOT_ALLOWED`.
3. Os dois bots não transferem saldo; aprovados consomem contador simulado do dia UTC. Pare e confira botões desabilitados.
4. Clear terminal limpa logs locais, preservando histórico e contador no backend; recarregar não restaura teto consumido.
5. Request Devnet Payment (0.5 SOL) usa executor real de teste; seguir [guia de pagamentos](PAYMENT_PANEL_MANUAL_TEST.md) e modo manual. Não clicar ao testar somente simulação.

## 5. Vault Budgets

1. Distinguir Register wallet/New vault (observação da Phantom) de Create test vault (signer separado).
2. Conferir seletores independentes no topo e no bloco de pagamentos. Para políticas do pagador, escolher mesmo cofre nos dois.
3. Editar limite de agente e conferir em Fleet/Simulator. Salvar cap do cofre com Save limit; refresh periódico não deve sobrescrever edição incompleta.
4. Configurar Low Balance Floor e Human Approval Threshold; salvar e alternar as três políticas. No simulador aprovação requerida bloqueia; no executor cria fila. Não há 2FA implementado por esse controle.
5. Liquidity recommendation deve informar recomendação por regras e ausência de transferência. Export deve baixar JSON do cofre do topo e agentes; não é backup completo.
6. Conferir painel de pagamento/fila/histórico conforme guia específico, sem declarar envio automático testado por build.

## 6. Falhas e apresentação

Em ambiente local isolado, simule API indisponível e confira erro/retry sem registros inventados. Retome a API e confira recuperação. Teste teclado, foco visível, fechamento de modal, rótulos acessíveis, zoom, contraste e ausência de cortes nos formulários em 390 px. Essa lista não é uma certificação de acessibilidade já executada.

Registre cenário, esperado, obtido, horário e evidência; remova apenas fixtures próprias. Não limpe banco do usuário. Use resultados Passou/Falhou/Bloqueado por ambiente/Não executado.

## Evidência histórica e limites

O QA de 09/10/2026 documentou telas locais com API/PostgreSQL, cadastro, limites, pause/resume, whitelist, simulador, notificações, políticas, exportação e recomendação. Essa evidência antecede main `1dd108f` e não declara o pagamento externo testado na VPS. Provider Phantom injetado não substitui extensão real, e mocks de pagamentos não comprovam liquidação Devnet. Resultados novos devem registrar ambiente, revisão e assinatura, quando houver.
