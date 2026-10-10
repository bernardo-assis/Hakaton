# 04 — Wallet authentication and owner isolation
Scope: authenticate Phantom signMessage only, no payment signing or custody delegation.
BFRI: isolated authentication service with durable PostgreSQL challenge/session and owner-scoped repositories; security-sensitive paths tested with real Ed25519 and two owners.

- [x] Backend: durable identity/challenge/session migration 0003
- [x] Backend: canonical expiring nonce, Ed25519 verification and atomic replay prevention
- [x] Backend: HttpOnly cookie session, CSRF and origin enforcement, expiry/logout
- [x] Backend: every app API requires session and owner filters; legacy account creation disabled
- [x] Backend: negative/two-owner/replay/concurrent/expired tests; migrate without wiping
- [x] Frontend: only after backend contract validated, Phantom signing flow and session restore/logout
- [x] QA: browser and extension limitation documented

Contract: docs/architecture/WALLET_AUTH_API.md. Backend before frontend. Auth identity never authorizes transfers. Existing local vaults adopted only when local placeholder user email/password and wallet-specific metadata match; other legacy records remain unclaimed.

Backend validation: PostgreSQL migration 0003 applied without wiping data. Build passed; 17 tests across four suites passed. Auth tests use real Node Ed25519 keypairs and real PostgreSQL: correct/wrong signature, consumed/expired challenge, concurrent verification, wrong/missing browser binding, expired/revoked sessions, denied origins/CSRF, two-owner reads/mutations on every resource, owner-filtered panic/metrics/history, tainted legacy shared-user records and disabled legacy registration/transfers. Existing simulator/faucet regression coverage preserved with authenticated fixtures and unique-record cleanup. Root restarted the running backend. No payment functionality enabled; browser integration approved with injected provider and real Ed25519 signatures. Real Phantom extension remains explicitly untested.

Frontend/QA validation: build and nine tests passed. Independent HTTP smoke passed 53 requests, including two owners and own-only panic. Chromium passed missing provider, signature rejection, signed login, HttpOnly/Strict cookies, matching-account restore, account switch clearing private data, second-account login and logout/401. Exactly one Header remains after restore and account changes; stale wallet buttons are absent. No JavaScript runtime errors. Replayable browser regression: frontend/tests/e2e/wallet-auth-browser.cjs. No transfers or funding requests were made. Subsequent payment work remains gated by user approval.


## Frontend e evidência da sessão — 2026-10-09

- Implementação liberada somente após build, migração e testes backend aprovados. O provider assina os bytes UTF-8 exatos da mensagem canônica; a assinatura é enviada em base64 e o backend confirma a sessão. Cookies permanecem HttpOnly; não há token em localStorage.
- Requisições relativas `/api` incluem cookies same-origin e proteção CSRF nas mutações. Respostas 401 invalidam somente a geração de identidade que iniciou a solicitação; uma resposta antiga não limpa a sessão da nova carteira.
- As páginas com dados montam somente depois da autenticação. Recarga restaura a sessão apenas quando a carteira conectada ou reconectada com autorização prévia corresponde ao proprietário confirmado pelo servidor.
- Troca de conta, desconexão, expiração e logout ocultam as páginas e notificações e limpam as preferências locais do simulador. Falha ao revogar a sessão oculta os dados e informa que é necessário tentar sair novamente; não comunica logout completo.
- Cadastro de cofre usa somente a carteira autenticada, com endereço preenchido e somente leitura. Assinatura de login não autoriza transferência; pagamentos permanecem desabilitados.
- Build frontend aprovado; nove testes aprovados (incluindo bytes exatos, recusa, geração de identidade e cookies/CSRF). Lint: zero erros e sete avisos, quatro já existentes e três sobre hooks/Fast Refresh da autenticação.
- Chromium com provider injetado e assinaturas Ed25519 reais validadas no backend: provider ausente, assinatura recusada, login A, cookie HttpOnly/SameSite Strict, recarga, troca para B com dados de A ocultos, recusa B, login B e logout passaram. Zero erros JavaScript. A regressão verifica um único Header e ausência do endereço antigo após troca de conta.
- O teste revelou chaves React iguais em componentes irmãos. A correção separou as chaves do Header e do conteúdo sem alterar o design. Browser, build e nove testes foram repetidos e aprovados após a correção.
- Limitação: a extensão Phantom real não foi operada neste ambiente; o contrato do provider foi exercitado no navegador com assinatura criptográfica real. Não foram solicitados fundos nem habilitados pagamentos.
