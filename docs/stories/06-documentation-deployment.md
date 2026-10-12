# Story 06 — English documentation and deployable hackathon build

Scope approved by the user: preserve both implementations, deliver repository/API/security documentation first, then prepare and validate Vercel plus a managed PostgreSQL backend deployment.

## Integration

- [x] Preserve the validated local implementation on bernardo before integrating dev-jotaf: checkpoint419026d.
- [x] Preserve landing, English UI, Docs, assets and modals while incorporating the isolated payment executor.
- [x] Keep one financial execution path; simulator real requests use the safe payment API.
- [x] Validate the combined frontend/backend and browser interactions without moving funds.

## Priority 1 — Documentation

- [x] English README: factual badges, concise value proposition, Mermaid architecture, three-step Docker quickstart, in-app Docs link and limitations.
- [x] docs/architecture/SECURITY_ARCHITECTURE.md: Ed25519, owner/wallet isolation, cookies, CSRF/origins, rate limits, encrypted test signer and recovery.
- [x] docs/api/REST_API.md: implemented endpoint contracts, authentication, payloads, states and errors.
- [x] Reconcile in-app Docs with the same contracts; no invented published SDK or cloud URL.

## Priority 3 — Deployment

- [x] Docker full-stack quickstart with isolated volumes, numbered migrations and persistent secrets.
- [x] Public health/readiness endpoint and managed PostgreSQL migration runner.
- [x] Vercel frontend root/build/dist and same-origin API proxy configuration prepared; actual backend HTTPS origin pending account connection.
- [x] Backend deployment manifest and environment templates; never deploy the legacy treasury execution path.
- [x] Build and validate a fresh database and HTTP flow locally; preserve existing local data.
- [ ] Publish the validated integration on bernardo in GitHub.
- [ ] Connect hosting accounts, create the managed database/backend, record actual API origin and deploy frontend.
- [ ] Verify real hosted HTTPS login, cookies, CORS, navigation and readiness.

No WSS transport is implemented by the current application; HTTP polling is the implemented payment-status mechanism. Do not invent a WebSocket endpoint or mark cloud deployment complete before actual hosted checks.

## Evidence — 2026-10-11

Integrated backend: root execution42 tests/11 suites passed, including valid legacy payload refusal and read/write polling quotas. Frontend:14 tests and build passed; lint zero errors/11 warnings. Root Chromium payment flow passed with API fixtures; separate root Chromium authentication passed against the real Docker API with generated Ed25519 keypairs, two owners, cookies, restore, account switch and logout. QA fixture cleanup targeted exactly the two generated wallets.

Docker images built; all three demo services healthy on8088. Migration runner:four isolated database tests passed; recreated containers preserved an exact fixture and four migration records. Root independently ran three YAML tests and three Vercel/bootstrap tests. SDK checks passed in the fresh production image; Devnet genesis was checked read-only. No funds, cloud resources or paid services were used.
