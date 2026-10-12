# Devnet payment panel manual test

Use Solana Devnet test SOL only. Phantom authenticates the owner; payments use a separate server-controlled test vault whose signer is encrypted in the backend.

1. Open the landing page and choose **Launch App**. Connect Phantom and sign the authentication message.
2. Open **Vault Budgets**, then **Devnet Payments**. Choose **Create test vault**. Its address must differ from your authenticated wallet. A disabled server configuration should produce a clear error.
3. In **Agent Fleet**, create an agent attached to that test vault. Set its limits and allowed recipients. Return to **Vault Budgets**.
4. Select **Manual approval** and request a small test payment. It should appear in the approval queue, with its full recipient address. It is not confirmed spend.
5. Change to **Automatic**. The earlier queued request must still await individual approval. New requests can dispatch automatically, subject to the same limits.
6. Approve the earlier request and follow its state. Sent and uncertain requests remain reserved until the server knows the network outcome. A timeout does not justify creating another payment with a different request identity.
7. Inspect **View on Solana Devnet** when a signature exists. **Spent in 24 hours** includes paid network fees, including fees of failed on-chain transactions.
8. Reject another manual request. Try an unlisted recipient and an amount above the cap; the server should block dispatch. Use **Load more requests awaiting approval** for queues above 100 requests.
9. Edit the vault cap, wait for the background refresh, and confirm your unfinished edit is retained. Save it explicitly.
10. In **AI Simulator**, select the test-vault agent and a Devnet recipient, then start the simulator. The normal bot buttons still evaluate policies without sending funds. **Request Devnet Payment (0.5 SOL)** makes a real test-vault request and must show its actual approval/network state instead of declaring immediate confirmation.
11. Use the existing panic button. Frozen agents/vaults must not dispatch new payments. Already sent requests still require reconciliation.
12. Reload and enter through **Launch App** again. Check the persisted mode, queue and history. Switch Phantom accounts or disconnect; the previous owner's private data must disappear.
13. Open **Docs** without signing in. Verify that the payment API examples use string lamports, stable request identities, the real endpoints and the separate test-vault signer model.
14. On a narrow viewport (390 px), inspect the payment form, queue and history for clipping.

## Automated validation

Run frontend tests and build in the project frontend directory. Browser regression scripts live in `frontend/tests/e2e/`.

- `payments-browser.cjs` uses a trusted injected wallet and mocked API responses. It covers landing entry, English labels, mode changes, previous approval queues, full recipient addresses, owner CSRF requests, uncertain network state, cap edits during refresh, queues above 100 requests, rejection, the Simulator payment action and the mobile payment panel. It does not send funds.
- `wallet-auth-browser.cjs` uses injected Ed25519 keys and the real local authentication backend. It covers missing provider, rejected signatures, session restoration, account switching and logout. Fixtures must be cleaned by their generated wallet IDs only.
- Unit tests cover integer lamports, state labels, Explorer network links, persisted retry identities and the shared owner payment transport. The new English assertions and transport test failed before implementation and passed afterward.

Browser mocks verify UI interaction. A real transfer and network confirmation require a separately authorized funded Devnet test.

## Dependency audit

The dependency audit found no advisories in production dependencies (`npm audit --omit=dev`). The Tailwind 3 build/watch tree has advisories for `braces` (GHSA-vfj7-8cjw-p6xm) and `postcss-selector-parser` (GHSA-rj75-hqrm-r3gf), reported as seven findings including dependent packages. These packages process source-controlled globs and CSS at build time; they are not included in the browser application. The registry currently offers no patched `braces` release or Tailwind 3 upgrade. The suggested Tailwind 4 migration changes the project's build configuration and is not applied as an automatic fix.

## Integration validation (2026-10-11)

- Frontend unit tests: 14 passed. The shared owner payment transport retains a stable request identity after a lost response and preserves pending approval as pending.
- Production build: passed with 42 modules, including the friend's landing, animation dependencies and public Docs module. The main JavaScript chunk is about 524 kB minified; Vite reports its standard size advisory.
- The orchestrator executed the integrated payment browser regression successfully: landing entry and English labels, earlier queue retained after switching to automatic, owner CSRF request, uncertain state without false confirmation, full recipients, cap editing during refresh, more than 100 pending requests, rejection, Simulator request through the same owner payment API and mobile panel without runtime errors. Every payment endpoint was mocked; no funds were transmitted.
- Authentication regression is a separate check against the restarted real local backend. Its results should be recorded by the orchestrator after execution.
