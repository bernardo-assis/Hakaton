# Financial adversarial assessment — 2026-10-11

Authorized scope: the local AgentSafe checkout and disposable PostgreSQL fixtures. No production targets, real Solana RPC submissions, faucet calls, user funds, or user records were modified. Wallet login uses real Ed25519 signatures. Financial execution uses an injected network; RPC evidence tests additionally sign real Solana transactions offline, but never transmit them.

## Reproduction and initial result

```sh
docker exec agentsafe_backend_local npm test -- --runInBand securityFinancial.test.ts
```

Baseline before remediation: **31 tests, 29 passed, 2 failed** (Jest exit 1). After the targeted backend correction, an independent rerun reported **31 passed, 0 failed** (Jest exit 0, 2.98 seconds). The original two failing assertions remain unchanged as regression tests. Fixtures have generated wallet addresses, UUIDs, and scoped cleanup; the signer key is a disposable fixture. No session cookies, credentials, private keys, or transaction bytes are logged.

## Confirmed gaps before remediation

| Finding | Preconditions and demonstrated behavior | Impact and required change |
| --- | --- | --- |
| FIN-01: credential expiration during recovery balance lookup | An agent payment has a durable `UNKNOWN` reservation; signature status is still unknown and its blockhash is eligible for identical rebroadcast. The credential is valid at the first recovery check, naturally expires during the RPC balance call, and the recovery worker still calls `send` again. Expected send count 1; observed 2. The fixture shortens expiration and waits 220 ms, rather than impersonating a DB attacker. | A retry can broadcast after the agent credential's authority expired. Recheck time-sensitive credential validity immediately before rebroadcast, after all RPC work. Preserve reservation and keep observing the original signature. |
| FIN-02: changed human-approval policy omitted by recovery | First broadcast has an uncertain transport result. The authenticated owner updates `require_human_approval=true` and lowers its threshold using `PATCH /api/vaults/:id/policies`. Recovery rebroadcasts the same bytes without owner approval because it checks execution mode, whitelist, caps and balances but omits this approval policy. Expected send count 1; observed 2. | Owner's current human-approval requirement can be bypassed by an optional retry. Recheck current approval policy before rebroadcast; keep the signed reservation unresolved instead of silently discarding/replacing it. An already transmitted transaction may still finalize regardless of this policy change. |

These are retry authorization defects. They do **not** demonstrate a second signature, double debit, theft across wallets, or the ability to cancel a transaction already received by Solana. A repeated signed Solana transaction retains its original identity.

## Verified defenses

| Attack attempt | Evidence |
| --- | --- |
| Invalid payment values: zero, negative, fractional, scientific notation, signed BIGINT overflow, excessive digit length, number instead of string, null | Eight HTTP requests returned 400 before preparing or broadcasting anything. |
| Inject owner, user, approval, settlement and signer fields into a machine payment | Strict input validation returned 400; no send. |
| Reuse an agent credential with another agent in the same vault | HTTP 401; credential is bound to its agent. |
| Use a stolen agent credential for owner approval or mode changes | HTTP 401; a machine token does not create a wallet owner session. |
| Use another genuinely signed-in wallet to request or inspect victim payments | HTTP 404; no send. |
| Change amount or recipient through approval body fields | HTTP 400; the original request remains pending. |
| Simultaneous replay with normalized amount | Same payment ID; exactly one broadcast. Changing recipient under the same idempotency key rejects with 409 and preserves original recipient. |
| Replay after revocation, including a revocation queued before the attacker at the vault lock | 401; no additional broadcast. |
| Credential expires during the original request's prepare call | 401; no broadcast. This working initial-request check highlights the missing recovery check. |
| Spend to a recipient outside owner whitelist, or violate low-balance floor | Rejected as `RECIPIENT_NOT_ALLOWED` / `LOW_BALANCE`, without send. |
| Two agents concurrently exhaust a common vault budget | Only one request succeeds; vault accounting includes principal plus network fee across agents. |
| Submit while the owner's freeze lock is ahead of the request | Frozen state is reloaded; 409 and no send. |
| Restart after unknown transmission | Recovery uses byte-for-byte original signed transaction and original signature; never prepares a replacement. |
| Approve with stale revision, approve twice in parallel, replay rejected manual request | Stale revision rejects; parallel approval broadcasts once; rejected request remains rejected after automatic mode is restored. |
| RPC reports another network genesis hash | Real network adapter rejects with 409. |
| RPC returns a different signature after broadcast | Real network adapter rejects `RPC signature mismatch`. |
| RPC supplies a different message under the expected finalized signature | Real network adapter rejects `Confirmed transaction mismatch`. |
| RPC reports confirmed status without finality | Remains `UNKNOWN`; finalized transaction evidence is not fetched. |
| RPC reports unsafe numeric balance or contradicts status error vs. transaction metadata | Unsafe balance or inconsistent confirmation evidence rejects. |

## Deliberately demonstrated remaining authority

A **still-valid stolen machine token can spend its agent's allowance**, including to a different wallet when recipient allowlisting is disabled. One HTTP reproduction returned 200 and reached the simulated broadcaster. This is the credential's intended capability, not an ownership bypass, and must be disclosed: token theft is not harmless. Enable recipient allowlisting, maintain small limits and short credential lifetimes, use manual approval for sensitive payments, and revoke compromised credentials.

## Limits

- Passing these tests provides evidence for the scenarios above, not immunity to every attack.
- Browser XSS, session/CSRF attacks, denial of service, public exposure, supply-chain dependencies, deployment and host security are covered separately by the coordinating audit, not proven by this financial suite.
- Malicious RPC tests replace the operator-selected dependency. They do not show that a public visitor can change the server's RPC URL. A completely dishonest RPC can fabricate internally consistent observation metadata; this suite proves selected consistency checks, not independent blockchain consensus verification.
- A separate server-managed Devnet signer is encrypted at rest, but a compromised backend with access to its encryption key can sign transactions. This is not equivalent to an on-chain policy-enforcing program or hardware-isolated signer.
- Panic/freeze and policy changes cannot undo a payment already accepted by the network; uncertainty must retain reserves and be reconciled.
- No live Devnet finality, real Phantom extension, production TLS or cloud network controls were exercised here.

## Remediation validation

The independent review of `PaymentService.reconcile` verified these focused corrections:

- **FIN-01 fixed for the reproduced expiry window:** recovery checks credential validity after the RPC balance lookup, rather than before it. The original expiry-during-RPC regression now leaves the reservation `UNKNOWN` and performs no additional send.
- **FIN-02 fixed:** recovery computes current approval requirements from both manual execution mode and the current human-approval policy/threshold. A transaction lacking the necessary owner approval is observed for finality but is not optionally rebroadcast. Its original signed reservation remains intact.

Independent verification command: the same command shown above, with **31/31 tests passing**. This includes the deliberate demonstration that a still-valid stolen token can exercise its authorized allowance; that limitation has not disappeared. No additional test cases or production changes were introduced during the independent review. The broader project's suite result is tracked by the coordinating audit rather than inferred from this targeted run.
