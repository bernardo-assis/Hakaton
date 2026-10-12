# 🚀 @devops / 🔍 QA / 🎨 UX — revisão da publicação

Data: 12/10/2026. Passagem PM/Analyst/Architect/SM recebida do Maestro: revisar publicação existente, explicar operação e listar lacunas; sem código ou implantação. Skills `aas-devops`, `aas-qa`, `aas-ux-expert` e AGENTS local/snapshot lidos fisicamente pelo terminal; `view_file` não está disponível neste Linux. Fonte: snapshot `origin/main` em `1dd108f5675f982fb5fe70d157f78907ad9f13aa`. Edições documentais feitas na cópia `bernardo`, sem commit.

## Evidências

HTTP público entre 18:20 e 18:23 UTC: HTTP `/` redireciona 301 para HTTPS; HTTPS `/` entrega HTML 200; `/api/auth/session` retorna JSON 200 `authenticated:false`, `no-store`, HSTS/nosniff/DENY; `/healthz` retorna texto `ok`; `/readyz` retorna HTML da landing com 200 pelo fallback SPA.

Chromium headless real em container descartável, sem dados persistidos, sem wallet provider injetado, login ou mutação financeira: viewport 1440×900 e 390×844, landing → Docs → landing → Launch App → gate anônimo. Zero exceções JS observadas nesse percurso. Três `ERR_ABORTED` de mídia cancelada na navegação, sem exceção de aplicação. Largura global não excedeu viewport; elementos decorativos cortados e links da navegação num scroller interno não devem ser tratados como overflow global.

Evidência copiável: [landing desktop](../review-evidence/2026-10-12/landing-desktop.png), [landing mobile](../review-evidence/2026-10-12/landing-mobile.png), [Docs mobile](../review-evidence/2026-10-12/docs-mobile.png), [relatório de navegador](../review-evidence/2026-10-12/public-browser-report.json). Originais temporários em `/tmp/agentsafe-public-review/`, incluindo Docs desktop e gate mobile. A captura pública não comprova views autenticadas.

## Resultado e pendências

| Prioridade | Achado | Ação concreta |
|---|---|---|
| P1 antes do pitch | Landing anuncia AI Forecasting/Predictive Analytics, multi-sig shielding, Smart Contract Shielding, análise AI e neutralização de ameaças. Código revisado entrega regras determinísticas, API e signer custodial de teste; não comprova essas capacidades adicionais | Reescrever marketing em torno dos recursos demonstráveis ou rotular recursos futuros |
| P1 antes do pitch | Depoimentos de Jane Doe/CFO GLOBAL BANK, Celine Smith/INVESTCORP e Mike Jones/FINCONSULT não têm comprovação no projeto | Remover ou identificar claramente como conteúdo ilustrativo; nunca apresentá-los como clientes reais |
| P1 operação | `/readyz` público responde HTML200, não saúde da API/banco | Monitorar readiness privada e documentar URL correta; eventual rota pública exige alteração revisada |
| P1 aceite | SSH, manifesto real, release/digest, backup/restore, persistência da chave e login/transferência real na VPS não comprovados | Inventariar instalação e executar aceite com evidência, sem inferir ausência de configuração |
| P2 UX | 390px: texto Connect Phantom Wallet quebra em três linhas e sai da altura do botão; navegação tem pouca área visível | Adaptar header mobile com layout/controle acessível e botão com altura suficiente; scroller interno é distinto do problema do botão |
| P2 credibilidade | Preços $199/$499/$899 e Contact Sales/Sign Up levam à mesma abertura do dashboard, sem billing identificado | Rotular planos como proposta futura ou alinhar CTAs à demo |
| P2 navegação | GitHub/X/Discord levam a homepages genéricas; Privacy/Terms/Disclosures usam `#`; Security Audit abre Docs geral | Apontar recursos reais e textos próprios, ou retirar links placeholders |
| P2 metadados | `<title>frontend</title>` sem descrição do produto | Identificar AgentSafe na aba/metadados |
| P2 confiança | “Solana Devnet: Operational” é texto estático no footer | Rotular rede utilizada; status operacional precisa de medição |
| P2 infra | Manifesto Swarm/Traefik não versionado, recursos/rotinas não confirmados; proxy sobrescreve proto interno e usa IP do proxy imediato | Versionar manifesto sem secrets; validar cadeia e rate limit por IP na VPS |

Docs pública chama `daily_limit` uma janela móvel UTC na seção de política; isso deve ser distinguido do simulador que reinicia no dia UTC. A janela financeira de 24 horas não reinicia à meia-noite. O guia operacional registra essa distinção; correção da UI é tarefa futura de código.

## Documentação entregue

`docs/DEPLOYMENT.md`: substitui afirmação histórica de ausência de URL pública, descreve fluxo navegador/proxy/API/DB/Devnet, variáveis, segredo estável, sessions/proxy/rate limits, startup/migrations, checks e demo versus VPS.

`docs/VPS_RUNBOOK.md`: inventário sem segredos, checks de leitura, pg_dump, restore isolado com executor desativado, chave correspondente ao backup, conciliação após snapshot antigo, atualização/rollback, diagnóstico de erros e evidências pendentes. O runbook não inventa nomes de stack, host ou serviços privados.

Nenhuma tarefa da VPS foi modificada; nenhum serviço local existente reiniciado; nenhum pagamento enviado. O domínio público responde, mas o readiness privado, signer, backup e release instalada precisam de inspeção própria. Passagem ao Maestro/QA para consolidação, links e revisão documental.
