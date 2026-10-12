# Authentication and API attack results — 2026-10-11

Scope: authorized local AgentSafe backend, branch `bernardo`, starting revision `a727c7f`. These are application-level regression attacks against the real Express application, PostgreSQL persistence, and generated Ed25519 identities. Solana RPC, airdrops, signing, and broadcasts are forbidden by test doubles. They are not internet penetration tests, production certification, or Phantom extension tests.

## Executed commands and results

```sh
docker exec agentsafe_backend_local npm test -- --runInBand src/__tests__/securityAttack.test.ts src/__tests__/auth.test.ts
docker exec agentsafe_backend_local npm test -- --runInBand src/__tests__/securityAttack.test.ts
```

Initial combined execution: existing authentication suite **7/7 passed**. The new suite initially had one incorrect expectation: `/api/transactions` returns `501` when the payment feature is disabled, rather than `404`. This is disabled execution, not a bypass. The expectation was corrected to the observed safe configuration.

Confirmed RED execution after that correction: new attack suite **31 passed, 3 failed, 34 total**. The three failures below proved the original defect. After remediation, independent QA reran both suites: **34/34 new attack cases and 7/7 existing authentication cases passed, 41/41 combined** (2.277 seconds). The original evidence is retained below; the three regressions are now corrected in source.

## Corrected finding: unhandled framework errors disclosed stack traces locally

Severity: medium information disclosure in the tested non-production configuration; no evidence of authentication bypass, code execution, or secret disclosure from these payloads. Production Express suppresses stack traces by default, but the missing application error handler still yields an inconsistent HTML API error contract. This report does not claim production was exploited.

| Reproduction | Observed status | Observed unsafe behavior | Required regression outcome |
| --- | --- | --- | --- |
| `POST /api/auth/challenge`, valid allowed Origin and CSRF header, `Content-Type: application/json`, body `{"owner_pubkey":` | 400 | HTML error response, `SyntaxError` / stack markers | JSON validation error with no stack or request body |
| Same route and headers, JSON padding of 110,000 ASCII characters | 413 | HTML error response, `PayloadTooLargeError` / stack markers | JSON size error with no stack or request body |
| Authenticated `GET /api/agents/%E0%A4%A/history` | 400 | HTML error response, `URIError` / stack markers | JSON invalid-path error with no stack |

Evidence: boolean stack detection returned `true` in all three cases. Tests deliberately avoid printing response bodies, session tokens, signatures, or secrets. The response statuses already reject these requests; the defect is information leakage and API error handling.

Remediation implemented in `backend/src/app.ts`: final four-argument Express error middleware returns fixed JSON messages for `400`, `413`, and unexpected `500`; it does not serialize the error, received body, stack, or internal path. It delegates to Express only if response headers were already sent, preventing a second response. The application also disables `X-Powered-By`. Existing Origin/session protections remain in place.

## Controls exercised successfully

| Attack family | Evidence observed |
| --- | --- |
| Forged/missing sessions | No token, arbitrary token and random correctly shaped token receive `401` across dashboard, vaults, agents, payments, notifications and simulation history |
| Ed25519 forgery and challenge binding | Wrong private key and a signature copied to another browser receive `401`; foreign Origin receives `403` |
| Signature replay/concurrent nonce use | Existing auth suite rejects repeated verification and permits exactly one of two concurrent consumers |
| Session lifetime/revocation | Authenticated tokens expired in fixture database and genuine tokens after logout both receive `401` on private payment data |
| Browser CSRF | Missing, foreign, `null`, comma-combined, trailing-slash and suffix-confusion Origins receive `403`; absent/`0`/`1, 1`/`true` CSRF header values receive `403` |
| Method override | GET with `X-HTTP-Method-Override: PATCH` does not freeze an agent |
| Payment/credential IDOR | Other wallet cannot read payment detail/config, change mode, issue/revoke credentials, request owner payment, approve or reject another wallet's payment (`404`); filtered payment list is empty |
| Management IDOR | Other wallet cannot rename/freeze agent, change whitelist, freeze vault, change policies, optimize, request faucet for foreign vault, read agent history or simulate for foreign agent (`404`) |
| Aggregate isolation | Wallet B's agents/dashboard/notifications/simulation history do not include wallet A fixtures; existing auth suite also exercises legacy shared-user/wrong-wallet rows and panic isolation |
| Mass assignment | `user_id`, `owner_pubkey`, `vault_id`, `execution_mode`, `encrypted_key` and `signed_tx_reference` extra fields on agent updates receive `400` |
| Monetary validation | Negative, zero, fraction, exponent string, signed-BIGINT overflow and very long decimal string receive `400` before network work |
| SQL injection | Benign `fixture' OR '1'='1` remains literal text on the owned row; another wallet's name remains unchanged. Injection-looking encoded ID is rejected with `400` without SQL internals |
| Query validation | Unknown payment filter property is rejected with `400` |

The common valid-cookie threat remains: a stolen, still-valid session cookie is a bearer credential and can act as its owner until expiration/revocation. These tests demonstrate resistance to forgery, expiry and replay after logout; they do not establish resistance to endpoint compromise or stolen credentials.

## Fixture and safety boundaries

Every run generates two fresh Ed25519 wallets and UUID-scoped agents/payment intents. Cleanup selects only those generated identities, deletes their transactions and vault trees, and removes their sessions/challenges/users. No existing wallet data is deliberately modified. Only benign injection strings are used; no destructive SQL, load flood, mainnet, real funds, or RPC broadcast is performed.

Remaining coverage limits: there is no browser XSS execution test in this suite, no real HTTPS reverse-proxy validation, no distributed rate-limit attack, no host/container escape attempt, and no assertion that all possible endpoints or vulnerability classes are covered. Financial concurrency, dependencies, browser/deployment protections and rate limits are separate audit tracks.

## Remediation verification

Independent code review confirmed that the handler is registered after all routes, uses the Express error-handler signature, never reads request contents into the response, and keeps unexpected errors generic. No production code was changed by this QA reviewer.

GREEN command rerun:

```sh
docker exec agentsafe_backend_local npm test -- --runInBand src/__tests__/securityAttack.test.ts src/__tests__/auth.test.ts
```

Result: **2 suites passed, 41 tests passed**. All three former failing requests now return JSON and the stack-marker boolean is `false`. These results validate the changed source loaded by Jest; deployment/restart and live endpoint validation are separate delivery checks.
