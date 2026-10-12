# Security architecture

## Trust and custody boundaries

AgentSafe is a backend-enforced policy firewall for SOL test payments on Solana Devnet. Phantom remains the owner's wallet: no Phantom private key is requested, imported or stored. Its message signature authenticates the owner and expressly does not authorize payments.

A newly provisioned test vault has a different address and a dedicated backend-held signer. The private key is encrypted with AES-256-GCM, a random nonce, and vault ID as authenticated additional data. `VAULT_SIGNER_ENCRYPTION_KEY` must be a stable, externally configured base64-encoded 32-byte key. Missing or invalid configuration fails closed. Plaintext buffers are cleared after transaction preparation; no signer, encrypted secret or signed transaction bytes are exposed in payment responses.

The operator holding the master key and database can access test-vault signers. Application compromise can bypass application policies. Consequently, “Zero-Custody Treasury Firewall” can describe separation from the user's Phantom treasury only when accompanied by this qualification; it cannot describe all vault custody. No on-chain policy program or multisig enforcement is claimed. Legacy observed Phantom vaults are never silently converted into backend-signable vaults.

## Identity and request authorization

The owner signs a server-generated Ed25519 challenge with a five-minute lifetime. Its exact message binds wallet, origin, nonce, issuance and expiry. A temporary HttpOnly cookie binds verification to the requesting browser. Challenge consumption and session creation occur atomically; the server stores session hashes, not raw session tokens.

Sessions last eight hours and use HttpOnly, SameSite=Strict cookies. Production cookies use Secure and the `__Host-` prefix; localhost development uses unprefixed cookies over HTTP. Every owner resource query is scoped by authenticated user AND wallet, including aggregates and panic. Unknown and inaccessible resources return 404. Wallet switching/logout clears the displayed identity and revokes or replaces the session as appropriate.

Owner mutations require an allowlisted `Origin` and `X-AgentSafe-CSRF: 1`. CORS permits only configured origins; a production frontend/API should share an origin through a proxy, preserving `Set-Cookie` and request cookies. Cross-site cookie workarounds are not a substitute for this contract.

External agents use a random credential issued for one agent, stored only as a hash, scoped to `payments:create`, with TTL 60–86400 seconds and revocation. A machine request to the exact `/api/agent-payments` path may omit browser Origin/CSRF only when it has neither Origin nor Cookie; it still requires the Bearer credential. Browser-origin requests retain origin/CSRF checks. Agent tokens do not grant configuration, approval or other agents' access.

## IDOR prevention

Insecure direct object reference (IDOR) protection comes from server-side ownership checks, not hidden UI controls. Vault/payment/agent reads and mutations join back to the authenticated user AND wallet. Dashboard aggregates, history, notifications and panic use the same scope. A guessed UUID belonging to another wallet returns 404; the request does not retrieve all records and filter them afterward. Agent Bearer credentials fix their agent scope, so supplying another agent_id does not grant access. Regression fixtures test another wallet associated with the same user as well as independent identities.

## HTTP hardening and rate limiting

Owner mutations require allowlisted Origin and the CSRF header; cookie-bound sessions and CORS enforce the browser boundary. Application responses add nosniff, DENY framing, restricted referrer/permissions and no cross-domain policy headers. HSTS applies only in production HTTPS. Health probes are defined before these application middleware and expose only no-store liveness/readiness data. No Content-Security-Policy enforcement is claimed by this middleware.

HTTP request throttling uses express-rate-limit, returning 429 for exceeded limits. Per-IP, per-minute quotas are 240 GET/HEAD reads, 100 mutations, 60 authentication writes and 30 financial writes on `/payments`, `/agent-payments` or legacy `/transactions`. Challenge and verification also share an additional 100-request/15-minute authentication limiter. Applicable quotas compose; OPTIONS is excluded from mutation limits. Financial spending caps remain independent of request-rate throttling.

Client IP resolution trusts 0 direct hops or 1 known terminating proxy via TRUST_PROXY_HOPS; never trust arbitrary forwarded hops. The limiter's default memory store is local to each process and resets on restart. Multi-instance deployments require a shared rate-limit store or upstream enforcement to achieve a global quota; shared database financial locks do not turn memory-based request throttling into distributed rate limiting. Configure proxy routing before relying on per-client IP quotas.

## Financial controls

Amounts and caps are positive integer lamport strings within signed PostgreSQL BIGINT range. Budgets use bigint/numeric accounting rather than JavaScript Number. The agent cap counts principal; the independent vault cap counts principal plus fees. Confirmed principal consumes the rolling 24-hour window; all unresolved reservations remain charged regardless of age. An on-chain failure releases principal but retains its actual fee in the vault budget.

A shared per-vault PostgreSQL advisory lock serializes writers across processes. Short SQL transactions lock vault before agent and atomically check policies/budgets and persist intent. RPC calls occur outside SQL transactions. Policy, whitelist, mode, freeze and panic mutations share the broadcaster's locking discipline. Panic prevents subsequent sends; it cannot revoke a transfer already broadcast.

Manual requests wait without reserving funds and revalidate current controls at approval. Switching automatic→manual requires approval for requests not dispatched. Switching manual→automatic never releases old queued requests. Versioned configuration prevents stale UI approval; approval is not permission to ignore whitelist, frozen state, available balance or limits.

## Durable execution and uncertainty

Idempotency is per agent and normalized request key/payload. Replaying the same request returns its record; using that key for different content returns 409. Signed bytes, deterministic signature, blockhash and validity height are persisted before first broadcast. Recovery reuses the same bytes/signature while valid and permitted; it does not automatically sign a replacement transfer.

Only verified finalized evidence changes a transfer to confirmed. The adapter checks Devnet genesis, expected signed message, signature, network transaction and consistent failure metadata. Snapshot minimum context guards against observing a slot older than finalized evidence available to the running adapter. UNKNOWN reservations may conservatively overstate unavailable balance until reconciliation; a timeout or missing status never proves failure.

When enabled, recovery runs at startup and every 15 seconds without overlap within a process; per-vault locks and queue scheduling coordinate concurrent workers. Expiry alone does not release a reservation or authorize a new signature. Inconclusive old requests remain UNKNOWN for controlled investigation.

## Deployment and assurance

Keep master key and database credentials outside version control; backup both encrypted data and its master key separately. Do not rotate the key by overwriting it without a migration strategy. Use HTTPS for production, same-origin API routing, restricted database access and exact allowed origins. Payment execution is an explicit opt-in and must fail closed outside verified Devnet.

Tests cover real PostgreSQL constraints, budgets, shared locks, identity isolation and deterministic network failures. The adapter test uses real Solana signatures with injected RPC; financial browser tests use API mocks. A separate browser test against the demo stack exercised the real authentication API with an injected wallet provider and real Ed25519 signatures: two-owner sessions, HttpOnly/SameSite=Strict cookies, restoration, switching, logout and provider refusal/unavailability passed. These do not certify production security or prove a real funded Devnet transfer, physical recovery of an on-chain pending payment, or real Phantom extension behavior. See [QA evidence](../PAYMENT_QA.md).


## Dependency audit scope

Audit snapshots on 2026-10-11 are scoped separately:

| Dependency scope | Findings |
| --- | --- |
| Frontend production | 0 reported audit findings |
| Frontend development/build tools | 7 advisories: 5 high and 2 moderate |
| Backend production after the directed UUID fix | 3 moderate affected-package entries; 0 high or critical |

The backend initially had five affected-package entries: `uuid`, `rpc-websockets`, `stream-json`, `jayson`, and `@solana/web3.js`. Targeted overrides now resolve **uuid 11.1.1** for Jayson and RPC Websockets, retaining CommonJS support and addressing [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The advisory concerns caller-supplied buffers in UUID v3/v5/v6, rather than the v4 request IDs used by the SDK client or the v1 socket IDs present in RPC Websockets. Real SDK serialization/signature tests, TypeScript and the integrated regression suite validate compatibility; this is not a general penetration test.

The remaining backend entries are `stream-json 1.9.1`, `jayson 4.3.0`, and `@solana/web3.js 1.99.0`. The latter two inherit the Stream JSON findings, so three affected-package entries do not mean three separate application vulnerabilities. Stream JSON advisories cover nested-path filter complexity ([GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x)), JSONC comment rescanning ([GHSA-hqr4-qq8f-hg3x](https://github.com/advisories/GHSA-hqr4-qq8f-hg3x)), and prototype mutation in the assembler ([GHSA-mjw6-4jj6-33hc](https://github.com/advisories/GHSA-mjw6-4jj6-33hc)). Addressing all three requires Stream JSON 3.6.0 or later, a major-version transition from Jayson's declared 1.x dependency; it was not applied as an unreviewed compatibility override.

Reachability review found no Stream JSON modules loaded when importing the real SDK in the built image. The SDK uses Jayson's browser JSON-RPC client, while AgentSafe HTTP bodies use Express JSON parsing. This limits the observed runtime exposure but does not prove affected paths can never be reached by future changes or alternate SDK use. The reported dependency findings remain open until a compatible upstream or tested dependency migration is completed.

A zero frontend audit count is not a claim that the backend, application, container OS or deployment is vulnerability-free. Build-tool advisories remain tracked separately, without a broad or breaking audit fix. HTTPS/proxy, browser wallet behavior and real financial recovery require their own validation.
