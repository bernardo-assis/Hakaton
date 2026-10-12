# Local browser, HTTP and container adversarial validation

Tested October 11, 2026 (Bahia; October 12 UTC), branch `bernardo`, baseline `a727c7f`, then repeated against the rebuilt demo with local security fixes. Final rerun: **10 HTTP checks passed and 3 Chromium attack checks passed**, plus response-header observations. Target: local isolated Docker demo at `http://localhost:8088`. Payments disabled. No transfer, faucet, Solana RPC request or third-party attack was performed. External browser asset traffic was explicitly blocked during the mocked XSS scenario.

## Observed defenses

| Attempt | Evidence | Result |
|---|---|---|
| Anonymous access to `/api/dashboard` | HTTP 401 | Blocked |
| Fabricated session cookie | HTTP 401 | Blocked |
| Hostile Origin on logout | HTTP 403; no permissive CORS response | Blocked |
| Missing Origin or CSRF custom header | HTTP 403 | Blocked |
| Bounded authentication guessing with a different forwarded IP per request | 65 requests per run; first 429 on attempt 58 initially and 39 finally, depending on shared local prior traffic; all subsequent attempts remained 429 | Blocked through nginx; not a distributed DoS test |
| JSON request of approximately 110 KB | HTTP 413, `application/json`, exact `Request body too large` public error | Rejected; initial stack leak fixed and retested |
| Malformed JSON | HTTP 400, `application/json`, exact `Invalid request` public error | Rejected; initial stack leak fixed and retested |
| Authenticated malformed UTF-8 URL `/api/agents/%E0%A4` | HTTP 400, `application/json`, exact `Invalid request`; no internal path/stack/input reflected | Blocked and sanitized |
| Reading `/.env`, `/.git/config`, `/backend/src/app.ts`, `/package-lock.json`, `/assets/index.js.map` | HTTP 200 returned byte-for-byte the same landing HTML | No sensitive file exposed; SPA fallback is not a file disclosure |
| `<svg onload=...>` in stored agent name, `javascript:` in agent role | Real application rendered mocked API values as visible text; `window.qaXss` stayed zero | Rendering protected in tested surfaces |
| `<img onerror=...><script>...</script>` in payment purpose | Real application rendered mocked API values as text; execution flag zero; local fixture exfiltration request count zero | Rendering protected in tested surfaces |
| `javascript:` in Solana signature | No javascript href and no explorer link rendered | Blocked by signature allowlist |
| Cross-origin clickjacking iframe | Chromium child frame became `chrome-error://chromewebdata/`; app launch control absent; live page sends `X-Frame-Options: DENY` | Blocked |

XSS results exercise the shipped React components with mocked persisted values. They do **not** claim an end-to-end authenticated storage test for these fields. Live HTTP authentication used freshly generated Ed25519 fixture keys; each successful login created one challenge, session, identity and user. Every created fixture row was precisely removed afterward, including one earlier URI-probe fixture whose assertion failed before logout. No existing user data was changed.

## Findings and limits

1. **Initial error disclosure fixed:** the initial development demo returned an Express HTML stack for malformed/oversized JSON, including `/app/node_modules` paths. After the terminal sanitized error handler was implemented and the demo rebuilt, fresh HTTP requests verified fixed JSON messages for malformed JSON, 110 KB bodies and authenticated malformed UTF-8 route parameters. Assertions now require JSON content type, exact public error bodies and absence of stack/internal paths. Extremely malformed percent escapes can be rejected directly by nginx as generic HTTP 400 HTML before reaching Express; that response does not expose an application stack.
2. **CSP absent:** the landing document had no `Content-Security-Policy`. Tested inputs stayed escaped, but a future injection would lack this additional browser barrier. CSP requires testing existing Spline/font sources and inline styles rather than blindly adding a policy that breaks the app.
3. **Fingerprinting partially reduced:** the final rerun explicitly asserted `X-Powered-By` absent from the API. The nginx `Server: nginx/1.31.6` header remains visible. This does not itself establish an exploitable vulnerability.
4. **Cookie/environment boundary:** the real fixture session was HttpOnly and SameSite=Strict; sensitive API replies were `Cache-Control: no-store`. `Secure` was false in this intentional HTTP development demo. Source enables `Secure` and `__Host-` names only in production. Production HTTPS, actual deployment origins and proxy termination were **not** tested here.
5. **Rate limiting boundary:** nginx replaces user-supplied X-Forwarded-For with the connection IP, and the observed authentication quota resisted our spoof attempts. Limits use memory, so multiple backend replicas/restarts would not share that quota. No volumetric or distributed denial-of-service test was attempted.

## Container evidence

Read-only `docker inspect` confirmed:

- Demo frontend runs as UID 101; backend as `node`.
- Both have read-only root filesystem, all Linux capabilities dropped, no-new-privileges, and `privileged=false`.
- Only demo frontend publishes `127.0.0.1:8088`; demo backend/PostgreSQL publish no host ports.
- Runtime build copies compiled code and uses mounted secret files; secret values were not printed.
- Existing development containers separately publish 3001, 5173 and 5432 on `0.0.0.0`. These are outside the demo isolation boundary and should not be exposed to an untrusted network.

No base-image CVE scanner was available/run. Filesystem restrictions reduce impact of a compromise; they do not prove the application or signer cannot be compromised.

## Dependency audit evidence

`npm audit --omit=dev --json` on backend: 3 moderate package findings, 0 high, 0 critical. Chain: `@solana/web3.js` → `jayson` → `stream-json`; scanner identifies complexity/DoS and prototype-pollution advisories. These are scanner findings, with no malicious RPC-provider exploitation attempted. Advisories: [nested filtering complexity](https://github.com/advisories/GHSA-528h-pc64-c93x), [JSONC complexity](https://github.com/advisories/GHSA-hqr4-qq8f-hg3x), [assembler prototype pollution](https://github.com/advisories/GHSA-mjw6-4jj6-33hc).

Frontend full audit: 7 affected package findings (5 high, 2 moderate), from Tailwind build tooling and transitive braces/PostCSS parsers. Frontend `npm audit --omit=dev`: **0 findings**. Do not present build-time parsing findings as demonstrated vulnerabilities in the static nginx-served browser app. Advisories: [braces stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [PostCSS selector complexity](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). A Tailwind major upgrade was not performed in this audit.

The final image omits the npm lockfile, so audit was run from corresponding local dependency containers with the repository lockfiles. Audit in the backend runtime image alone returns ENOLOCK. No package mutation was made.

## Reproduction

With the isolated demo running, execute `node backend/tests/security-http.cjs`. Chromium runner: `PLAYWRIGHT_MODULE=/path/to/playwright node frontend/tests/e2e/security-browser.cjs`. Both default to localhost:8088; override `AGENTSAFE_UI_URL` only for an authorized local environment. The HTTP script prints its fresh fixture public key for exact cleanup; repeated runs consume the authentication quota and should wait for the minute window before retrying. Never delete unrelated identities.

These successful defenses apply to the tested vectors. This validation does not prove immunity to every attack, production TLS correctness, stolen wallet sessions, compromised backend/signing keys, malicious browser extensions, or infrastructure denial of service.
