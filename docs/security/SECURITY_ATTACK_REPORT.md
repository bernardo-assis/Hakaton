# AgentSafe security attack report

Date: October 11, 2026 (Bahia; October 12 UTC). Authorized target: the local project on branch `bernardo`, starting revision `a727c7f`, and its isolated Docker demo at `http://localhost:8088`.

## Outcome

The assessment reproduced and corrected three findings: framework error disclosure, expired-credential rebroadcast, and rebroadcast contrary to a newly required human approval. Five failing regression cases demonstrated these findings before correction. The complete backend suite then passed **107 tests across 13 suites**, including **65 new adversarial cases**. Independent reviewers repeated the authentication/API and financial suites successfully. TypeScript build and the rebuilt demo passed; live HTTP and Chromium validation are detailed in the browser report.

These results establish protection for the tested scenarios. They do not certify immunity to every attack or production readiness.

## Method and evidence

- Real Express/PostgreSQL requests with fresh Ed25519 identities tested session forgery, replay, ownership, CSRF, input handling and authorization.
- Concurrent requests, policy changes and delayed network responses exercised financial state transitions. Injected network adapters prevented real transfers; selected Solana SDK checks signed disposable transactions offline.
- Bounded live HTTP checks and Chromium exercised the local nginx demo, rate limiting, cookie flags, clickjacking and malicious text rendering. Stored XSS values were supplied through mocked API responses, rather than persisted through the live application.
- Dependency audits and read-only container inspection assessed deployment defenses. There was no public-target scan, infrastructure flood, destructive injection, mainnet interaction or movement of funds.

Detailed evidence and commands: [authentication/API](AUTH_ATTACK_RESULTS.md), [financial](FINANCIAL_ATTACK_RESULTS.md), [browser/HTTP/infrastructure](BROWSER_INFRA_ATTACK_RESULTS.md).

## Findings corrected

| Finding | Initial evidence | Correction and verification |
| --- | --- | --- |
| Framework errors exposed internal stacks in development | Malformed JSON, a 110 KB JSON body and an invalid encoded URI returned HTML with stack markers: three failed regressions. No secret theft or code execution demonstrated. | Terminal error middleware returns fixed JSON for 400, 413 and 500; it does not serialize the exception or input. Express fingerprint header disabled. All three regressions passed and rebuilt HTTP responses were verified. |
| Credential expired during recovery RPC | Optional recovery sent the original signed transaction again after the credential expired during a balance lookup. | Recovery revalidates credential lifetime after the balance lookup. The regression passed; original signature, bytes and unresolved reservation are retained. |
| Recovery ignored newly required human approval | An owner enabled approval through the policy API after uncertain transmission; recovery still retransmitted without approval. | Optional rebroadcast now applies the current approval policy as well as manual mode. The regression passed; observation of the original signature continues. |

The financial findings were retry authorization defects. They did not demonstrate a second signature, double debit or cross-wallet theft. A freeze, revoked credential or changed policy cannot recall a transaction already accepted by the network.

## Attacks blocked in the tested scenarios

| Attack | Observed protection |
| --- | --- |
| Read or modify another wallet's agents, vaults, payments or credentials by changing IDs | Owner and wallet filtering rejected access or returned an empty scoped list. Aggregates and panic actions retained isolation. |
| Forge a session, sign with the wrong key, reuse another browser's challenge, replay a consumed nonce or logged-out session | Signature/challenge/session checks rejected the request; concurrent challenge consumption allowed one login. |
| Browser CSRF and misleading Origins | Required Origin and custom header checks rejected missing, foreign and malformed values. |
| Inject privileged owner, approval, signer or settlement fields | Strict payload schemas rejected extra fields. |
| SQL injection through tested names and IDs | Injection text remained literal data; malformed identifiers were rejected without SQL internals. This is scoped evidence, not a claim about every query. |
| Stored script/event-handler strings on tested UI surfaces or malicious Explorer URL | React rendered text without execution or fixture exfiltration; invalid signatures produced no Explorer link. |
| Embed the application in an attacker-origin iframe | Live Chromium refused framing through `X-Frame-Options: DENY`. |
| Oversized JSON and repeated authentication attempts | JSON above the parser limit returned 413; bounded requests reached 429. Spoofed forwarded IPs did not bypass the tested nginx proxy. |
| Concurrent duplicate payment, altered replay, stale approval and overspending a shared vault | Idempotency, configuration revisions and vault locking prevented the tested extra broadcasts and budget overruns, including network fees. |
| Expired/revoked agent token, wrong agent scope, non-whitelisted recipient or frozen agent/vault | Current authorization and financial policies rejected the tested request/rebroadcast. |
| Wrong-network RPC, mismatched signature/message or insufficient finality | Selected network consistency checks rejected evidence or retained `UNKNOWN`; recovery used the same persisted signed bytes. |

## Remaining exposure and unverified boundaries

1. **A stolen valid credential still grants authority.** A real HTTP test demonstrated that a valid machine token can spend its agent allowance, including to arbitrary recipients when the whitelist is disabled. A stolen live owner session similarly acts as its owner until expiration/revocation. Small allowances, recipient whitelists, short token lifetimes and manual approval reduce this exposure.
2. **The backend holds authority over the separate Devnet vault.** Signer encryption protects stored keys, but an attacker controlling the backend and encryption key can sign. The firewall is not enforced by an on-chain program or a hardware-isolated signer. Owner Phantom keys are not imported by this design.
3. **CSP is absent.** Tested rendering resisted injection, but there is no additional Content Security Policy barrier against a future XSS defect. A compatible policy needs validation with the app's external assets. nginx still reveals its version.
4. **Dependency findings remain:** backend runtime audit reported three moderate affected packages; frontend runtime reported zero, while its build dependencies reported seven findings (five high, two moderate). Scanner findings were not reproduced as exploits; they remain maintenance work, not evidence of a clean supply chain.
5. **Rate limits are local to each process.** They do not establish resistance to distributed/volumetric DDoS or share quotas across replicas/restarts. WAF, edge throttling, load limits and production infrastructure were not tested.
6. **Deployment was local HTTP.** Production HTTPS, Secure cookies, provider routing, live Phantom extension, real Devnet settlement, malicious extensions and host/container escape were not tested. The demo binds only loopback; separate development containers currently expose their ports on all host interfaces and require a trusted network/firewall.
7. **RPC consistency is not independent consensus verification.** Selected fabricated replies failed, but a completely dishonest provider could fabricate internally consistent observations.

## Reproduction

```sh
docker exec agentsafe_backend_local npm test -- --runInBand
docker exec agentsafe_backend_local npm run build
node backend/tests/security-http.cjs
PLAYWRIGHT_MODULE=/path/to/playwright node frontend/tests/e2e/security-browser.cjs
```

Use only an authorized local demo. The HTTP runner generates an authentication fixture and prints its public key for precise cleanup; see its detailed report before repeating. Backend fixtures clean up their generated identities and vault trees. Authentication quotas can affect repeated HTTP runs within the same window.
