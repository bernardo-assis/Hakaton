# Integração das telas com a API

Escopo autorizado: conectar controles e substituir dados fictícios por dados reais, tela por tela, começando por Overview. Preservar o design existente. O frontend acessa exclusivamente a API; nenhum acesso ao banco no navegador. Usuário autorizou leitura das skills pelo terminal em substituição à ferramenta indisponível `view_file`.

## Critérios de aceite

- [x] Overview: saldo, agentes, gastos e transações vêm da API; pesquisa, filtros e ações retornam resultados reais.
- [x] Operações financeiras distinguem autorização, envio e confirmação; erro não aparece como pagamento bem-sucedido.
- [x] Header: notificações reais ou estado vazio; Phantom conecta/desconecta e apresenta falhas sem simular conexão.
- [x] AI Simulator: Start/Stop impede novas ações após parada; pedidos são avaliados no backend; orçamento vem da API; reset não apaga gastos reais.
- [x] Agent Fleet: criar, consultar, filtrar, editar e pausar agentes persistem pela API; valores inválidos são rejeitados.
- [x] Vault Budgets: dados reais, criação e ajustes persistidos; orçamento indisponível recebe estado compreensível.
- [x] Todas as telas exibem carregamento, vazio e erro sem substituir falhas por valores fictícios.
- [x] Backend validado antes da integração frontend; verificações de regressão aprovadas.
- [x] Build frontend/backend, testes de API com PostgreSQL real e interações no navegador aprovados.
- [x] Guia manual atualizado; lição registrada em AGENTS.md.

## Baseline QA — 2026-10-09

- Backend `npm run build`: aprovado.
- Frontend `npm run build`: falha TS6133 por imports React não usados no Header e nas quatro telas.
- Backend `npm test`: bloqueado antes de executar testes pela dependência ESM uuid via rpc-websockets/web3.js.
- Simulator: aprova e bloqueia localmente por temporizadores, limite fixo 5 SOL; Start/Stop não interativo.
- Header e múltiplos controles Fleet/Vault sem handlers.

Validação da integração local concluída em 2026-10-09. Conexão Phantom não equivale a autenticação de usuário; não declarar isolamento multiusuário ou pagamento confirmado sem prova.

## Evidências finais QA

- Builds aprovados; backend 11 testes / 3 suítes e frontend 6 testes, conforme execução final dos responsáveis.
- Smoke LIVE com PostgreSQL: concorrência, replay, conflito, whitelist, política de aprovação, congelamento e ausência de liquidação passaram. Endereço inválido, zero e negativo rejeitados com HTTP 400.
- Chromium: quatro telas navegáveis; criação de cofre e agente, edição, pesquisa, pause/resume, Start/Stop, recarga, limpeza do terminal, políticas, ajustes, exportação, notificações, recomendação por regras e emergência passaram. Zero erros JavaScript no smoke principal.
- Phantom: ausência da extensão e provider injetado para recusa/conectar/desconectar passaram; extensão real e assinatura não testadas. Nenhum faucet externo solicitado durante QA.
- Comparação visual desktop: paleta, tipografia, cards, grid e header preservados; seletores/formulários necessários acrescentados no estilo existente. Capturas baseline/after em /tmp/agentsafe-qa/.
- Rate limit respondeu HTTP 429 durante repetição intensiva, exibindo erro real; backend reiniciado para concluir testes. Fixture QA específica removida, ambiente mantido ativo.
- Não há autenticação ou isolamento multiusuário; simulações não enviam SOL e saque/transferência ficam indisponíveis. Responsividade estreita e extensão Phantom real exigem teste manual.
