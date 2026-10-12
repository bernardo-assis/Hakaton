# REST API

Base path: `/api`. Use the frontend's origin through its API proxy. Responses are JSON:

```json
{"success":true,"data":{}}
```

Errors use `{"success":false,"error":"..."}`; validation errors may add `details`. Do not rely on exact human-readable error strings as a stable protocol. Strict Zod bodies reject unsupported properties.

## Authentication

Owner endpoints use the HttpOnly session cookie. Browser mutations require an allowlisted `Origin`, `Content-Type: application/json` and `X-AgentSafe-CSRF: 1`; send cookies with same-origin credentials. Cookies cannot be read by frontend JavaScript.

| Method | Path | Body / behavior |
| --- | --- | --- |
| POST | `/auth/challenge` | `{ "owner_pubkey": "<base58 wallet>" }`; returns challenge_id, exact message and expires_at; sets temporary browser cookie |
| POST | `/auth/verify` | `{ "challenge_id": "<uuid>", "signature": "<base64 Ed25519 signature>" }`; validates signed message, origin/browser binding and TTL, consumes challenge once and sets session cookie |
| GET | `/auth/session` | Returns authenticated, and owner_pubkey/expires_at when authenticated |
| POST | `/auth/logout` | `{}`; revokes session and clears cookies |

Sign the UTF-8 bytes of the server's returned message using Phantom; encode the resulting 64-byte signature as standard base64 (not base58). Challenge expiry is five minutes; session lifetime is eight hours. Login does not delegate Phantom funds. Production names are `__Host-agentsafe_login` and `__Host-agentsafe_session`; development names omit `__Host-`. HttpOnly/SameSite=Strict apply; Secure applies in production.

## Vaults and controls

All UUID parameters are validated. Owner identity comes from the cookie, never a body user_id or owner override. Existing observed wallet vaults have no backend signer.

| Method | Path | Body / result |
| --- | --- | --- |
| GET | `/vaults` | Owner vault list, policy/budget/public address/signer readiness |
| POST | `/vaults/local` | `{ "owner_pubkey": "<authenticated wallet>" }`; creates or reuses observed wallet record; not a payment signer |
| POST | `/vaults/devnet` | `{ "daily_cap_lamports": "1000000000" }` (optional cap defaults to 1 SOL); creates separate encrypted signer and address; 201 |
| PATCH | `/vaults/:id` | `{ "status": "ACTIVE" }` or FROZEN |
| PATCH | `/vaults/:id/policies` | Full validated policy object below |
| POST | `/vaults/:id/optimize` | `{}`; existing policy optimization action |
| GET | `/vaults/:id/payment-config` | execution_mode, mode_version, cap, signer_ready, network, enabled flag and financial totals; unavailable RPC balance may be null |
| PATCH | `/vaults/:id/payment-config` | `{ "execution_mode": "MANUAL", "expected_mode_version": "1", "daily_cap_lamports": "1000000000" }`; cap optional; stale version 409 |

Policy shape:

```json
{
  "pause_on_low_balance": false,
  "low_balance_threshold_lamports": "0",
  "require_human_approval": false,
  "approval_threshold_lamports": "0",
  "block_unlisted_recipients": false
}
```

Modes are `AUTOMATIC` and `MANUAL`. Both use the same separate signer. Manual→automatic preserves prior approval requests; automatic→manual affects undispatched requests. Human approval threshold can require approval even in automatic mode. Mode versions and monetary values are strings. Monetary limits and payment principal are positive, <= 9223372036854775807 lamports; thresholds may be zero as allowed by their schema. Agent creation/edit and legacy policy/simulation inputs currently impose the stricter JavaScript safe-integer ceiling (9007199254740991), even though the payment/vault-cap service accepts signed BIGINT strings. No SPL asset selector or mainnet option exists.

## Agents and machine credentials

| Method | Path | Body / result |
| --- | --- | --- |
| GET | `/agents` | Owner agents and budgets |
| POST | `/agents` | vault_id, name, role, agent_pubkey, daily_cap_lamports; optional single_tx_cap_lamports (defaults daily) and whitelist_enabled; 201 |
| PATCH | `/agents/:id` | Validated editable agent fields; single cap cannot exceed daily cap |
| PATCH | `/agents/:id/whitelist` | `{ "recipients": [{ "recipient_pubkey": "<base58>", "label": "Test recipient" }] }`; replaces list, no duplicates |
| GET | `/agents/:id/history` | Owner-scoped transactions and audit history |
| POST | `/agents/panic` | `{}`; freezes only authenticated owner's agents |
| POST | `/agents/:id/credentials` | `{ "ttl_seconds": 3600 }`; optional TTL defaults 3600, valid 60–86400; 201 and token returned once |
| DELETE | `/agents/:id/credentials/:credentialId` | Revokes only a credential belonging to that owner/agent |

Keep machine credentials in the external agent's secret storage, not the panel's localStorage or source code. Credentials are hashed, agent-specific and scoped to `payments:create`. The panel uses its owner session instead.

## Payments

| Method | Path | Authentication / body |
| --- | --- | --- |
| POST | `/payments` | Owner cookie + Origin/CSRF; normalized payment body |
| POST | `/agent-payments` | `Authorization: Bearer <token>`; same body, agent must match credential |
| GET | `/payments` | Owner cookie; optional vault_id, approval_status, limit 1–100 (default 100), offset 0–100000 (default 0) |
| GET | `/payments/:id` | Owner cookie; recover one persisted request, inaccessible IDs 404 |
| POST | `/payments/:id/approve` | Owner cookie + Origin/CSRF; `{ "expected_mode_version": "2" }`; rechecks policies and reserves before sending |
| POST | `/payments/:id/reject` | Owner cookie + Origin/CSRF; `{}`; rejects an undispatched pending approval |

Normalized request:

```json
{
  "agent_id": "<agent UUID>",
  "idempotency_key": "<one stable key per payment intent>",
  "recipient_pubkey": "<explicit Devnet test recipient>",
  "amount_lamports": "10000000",
  "purpose": "Approved test payment"
}
```

`purpose` is optional, max 500 characters. idempotency_key is 1–100 characters. Do not generate a new key on retry after timeout; reuse the exact intention key. Equivalent numeric leading zeros normalize to the same amount. Different payload with an existing key returns 409. Request hash/actor are derived by the server.

Current payment POSTs return 200 with a persisted payment record, **including pending/UNKNOWN results**; 200 does not mean finalized settlement. Creation of vaults/credentials returns 201. Payment responses omit signed bytes, request hashes and signer secrets, and include identifiers, approval/settlement, amounts/fees and signature when available.

Approval statuses: `NOT_REQUIRED`, `PENDING`, `APPROVED`, `REJECTED`. Settlement statuses: `NOT_SUBMITTED`, `RESERVED`, `SUBMITTED`, `CONFIRMED`, `FAILED`, `UNKNOWN`. Decision is `APPROVED` or `BLOCKED`. Human approval and settlement are independent; an approved request can still be uncertain or failed. Manual requests wait without reserving until approval; expiry/timeout never implies refund or cancellation.

Discover the whole pending queue using `approval_status=PENDING`, incrementing offset by the returned page length until fewer than limit records are returned. Recover a known intention through detail rather than relying on the recent history page. Explorer links use `https://explorer.solana.com/tx/<signature>?cluster=devnet`.

Machine clients without Origin AND without Cookie can call the exact `/api/agent-payments` route without the browser CSRF header. A request with either browser header is subject to the normal Origin/CSRF guard. Every machine request still requires its valid Bearer token. Do not attach owner cookies to machine requests.

## Dashboard and simulation

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/dashboard` | Owner-scoped summary |
| POST | `/dashboard/deposit` | `{ "vault_id": "<uuid>", "amountSol": 0.1 }`; Devnet faucet, not a customer deposit; amount> 0 and <= 2, exact integer lamports; official RPC only |
| GET | `/notifications` | Owner audit notifications |
| POST | `/simulator/evaluate` | `{agent_id,amount_lamports,recipient_pubkey,purpose?,request_id}`; evaluates/audits policies without signing/sending payment |
| GET | `/simulator/history` | Owner simulation history |

Simulation history is not real spending and may use its historical UTC-calendar budget model. Real payments use a rolling 24-hour budget. Faucet errors or provider quotas do not imply a payment occurred. Withdrawals, `POST /transactions`, generic `POST /vaults` and open `/users` registration remain unavailable 501; use the explicit wallet/payment APIs.

## Errors and recovery

| HTTP | Meaning |
| --- | --- |
|400 | Invalid body/parameter, credential format or unsupported faucet input |
|401 | Missing/expired session or invalid/expired/revoked agent credential |
|403 | Disallowed Origin or missing browser Origin/CSRF header |
|404 | Missing resource or resource outside owner scope |
|409 | Idempotency conflict, stale version, policy/budget/balance block, or invalid transition |
|429 | Rate limit; respect response headers and retry without replacing the intention key |
|500 | Generic internal error; details/secrets not returned |
|501 | Disabled executor, missing encryption key, or unavailable legacy operation |
|503 | Authentication temporarily unavailable |

Per-IP limits use a one-minute window: 240 GET/HEAD reads, 100 mutations (excluding GET/HEAD/OPTIONS), 60 authentication writes, and 30 financial writes to `/payments`, `/agent-payments` or legacy `/transactions`. Challenge and verification also share an additional 100-request/15-minute limiter. Applicable limits compose; stores are in-process memory and reset on restart. Poll modestly and do not assume an SDK package is published. No `@agentsafe/sdk` installation is supported by this repository's dependencies.

RPC failure after potential broadcast yields UNKNOWN and retains budget. Recovery reads durable bytes/signature, checks history and may retransmit identical valid bytes; never automatically sign a replacement. Expired/inconclusive history remains reserved pending investigation. API errors before broadcast generally reject the request; policy-blocked submissions are not guaranteed to create a payment record. Audit/history must not be interpreted as proof of on-chain payment.

## Configuration and migrations

Runtime configuration: DATABASE_URL (or DATABASE_URL_FILE), DATABASE_SSL, PORT, TRUST_PROXY_HOPS (0 or 1), AUTH_ALLOWED_ORIGINS, NODE_ENV, SOLANA_RPC_URL, DEVNET_PAYMENTS_ENABLED and VAULT_SIGNER_ENCRYPTION_KEY (or VAULT_SIGNER_ENCRYPTION_KEY_FILE). File variants load read-only mounted secrets. Production requires HTTPS and Secure cookies; use a same-origin API proxy with exact public origins. Do not use legacy TREASURY_SECRET_KEY for a user's separate signer.

Run `npm run migrate` from `backend/` with DATABASE_URL or DATABASE_URL_FILE configured. `npm run start:production` invokes the startup runner, which applies versioned migrations before launching the built server; build first with `npm run build:production`. Migrations in `backend/src/db/migrations` are recorded with checksums and serialized by an advisory lock; mismatched recorded SQL or an incompatible existing baseline refuses startup. Initial schema, vault policies, wallet authentication and Devnet payment migrations preserve existing records; older observed vaults stay unsigned/manual. Do not assume mounting init SQL reruns migrations on an existing PostgreSQL volume. See [deployment guide](../DEPLOYMENT.md) for executable commands, readiness endpoints and configuration. This API reference describes application contracts, not a published deployment or live-funded payment guarantee.


Public deployment probes are outside `/api`: `GET /healthz` returns 200 `{ "status": "ok" }`; `GET /readyz` checks PostgreSQL and returns 200 `{ "status": "ready" }` or 503 `{ "status": "unavailable" }`. They are unauthenticated, no-store and contain no payment/identity data; their envelope intentionally differs from application endpoints. `TRUST_PROXY_HOPS` accepts only 0 (direct) or 1 (one known reverse proxy); never enable a blanket trust-proxy setting.
