# AgentSafe — judges’ walkthrough

**Demo:** https://agentsafe.kernellabs.uk/

**Goal:** evaluate a treasury firewall that checks agent spending policies, requires human approval when configured, and tracks a separate Solana Devnet test vault through payment settlement.

Allow roughly **10–15 minutes after wallet setup and funding**. Faucet availability and network finalization may take longer. This walkthrough is self-contained: you do not need to read the other documents to follow it.

Reviewed against remote `main`, commit `1dd108f5675f982fb5fe70d157f78907ad9f13aa`, on 12 October 2026. The owner reports a VPS deployment at the demo URL. The installed revision has not been independently identified; expected results below are acceptance criteria, not a claim that authenticated flows or funded transfers passed on that VPS.

## 1. What is implemented

| Part | Actual behavior |
|---|---|
| Wallet sign-in | Phantom signs a login message; the backend verifies ownership and creates an owner-scoped session |
| Agent configuration | Name, purpose, public identifier, vault association, per-payment/daily limits and recipient whitelist |
| Firewall | Deterministic backend checks; no LLM is invoked to decide these payments |
| Simulator | Evaluates policies and records outcomes; its two bot buttons do not transfer SOL |
| Test vault | Separate Devnet account, with a signer encrypted in the backend; the server signs for this account |
| Payment executor | SOL on Devnet, automatic/manual modes, persistent requests, reservations, approval and network reconciliation |
| Storage | PostgreSQL for identities, policy configuration, requests and audit records |

The prototype does not implement mainnet payments, SPL token payments, multisig approval or an on-chain policy program. Registering an agent does not start an external AI worker. The owner’s Phantom private key stays in Phantom; the test vault is server-controlled. Claims about zero custody apply to the owner’s Phantom wallet, not to the separate test vault.

## 2. Prepare the three addresses

Use a desktop browser with the Phantom extension available. Prepare two public Solana account addresses; they can be two accounts in your own Phantom so you can also test account isolation. Neither needs real-money SOL. Do not enter a private key or recovery phrase anywhere.

| Label in this walkthrough | Source | Where it goes |
|---|---|---|
| **A — owner** | First Phantom account | Sign-in; also useful as an unlisted test recipient |
| **B — recipient** | Second test account (or a consenting friend’s public Solana address) | Agent’s Allowed addresses and payment/simulation recipient |
| **C — test vault** | Created by AgentSafe below | Fund this address with Devnet SOL; it pays B |

Use **full** addresses. An abbreviated label such as `6ZbpLzfE…` cannot be used for funding or payment. B must be different from A and C for these checks. Quick deployment generates the agent’s identifier automatically; no fourth wallet account is required. If using the full agent form, B is a valid public identifier to enter in **Solana Public Key (Wallet)**: that field does not supply the payment signer.

## 3. Sign in as A

1. Open the demo and click **Launch App**.
2. Click **Connect Phantom Wallet**, connect account A and sign the requested login message.
3. Wait for the server verification. The private dashboard should appear only afterward.
4. Reload and enter through Launch App again if needed. Your session/data should remain associated with A.

The signature authenticates A; it does not authorize a transfer from A. Rejecting it should leave private data hidden. **Docs** can be viewed without signing in.

## 4. Create C, fund it and set manual mode

1. Open **Vault Budgets**. In the **Devnet Payments** block, click **Create test vault** once.
2. Select it in **Test vault** and copy the full **Devnet SOL deposit address** using **Copy**. Record it as C; it must differ from A.
3. Click **Get test SOL from faucet.solana.com**. Choose Devnet, enter C and request test SOL. Approximately `1 SOL` is ample for this small walkthrough if the faucet permits it.
4. Return and wait for **Available balance** to update. It must cover `0.01 SOL` plus the network fee. Refresh is approximately every 15 seconds when no action is processing.
5. Change **Payment mode** to **Manual approval** **before requesting any payment**. New vaults start in **Automatic** in the reviewed implementation.
6. Set **Vault rolling 24-hour limit (SOL)** to `1` and click **Save limit**.

**Create test vault** creates another account each time; it is not a balance refresh. **Register wallet / New vault** outside this block records the owner’s observed wallet and does not create a payment signer.

If funding is unavailable, record the payment checks as **Blocked by environment**. Public Docs remain available; policy simulations may still work if the agent exists and the low-balance policy does not require unavailable funding. Do not promise simulation approval irrespective of the selected policies. If test-vault creation itself is disabled, do not treat that as successful payment acceptance; use public Docs and record the limitation.

## 5. Create a fresh agent and restrict it to B

1. In the same Devnet Payments block, click **Quick Deploy Test Agent**. This creates an agent attached to C, initially with **5 SOL daily**, **1 SOL per payment**, and **whitelist off**.
2. Open **Agent Fleet** through the top navigation. Find the newly created test agent and click **Edit Limits**.
3. Keep **Treasury Vault** on C. Set **Daily Limit (SOL)** to `1` and **Per-Transaction Limit (SOL)** to `0.5`.
4. Enable **Restrict allowed recipients (Whitelist)**. Enter **only B** in **Allowed addresses**.
5. Click **Save Agent**. Reload and confirm the limits, whitelist and active status persist.

If Quick Deploy is absent in the installed version, use **Deploy New Agent**: select C, enter a name/purpose, enter B as the valid **Solana Public Key (Wallet)** identifier, and use the same limits/whitelist above. That field is required by the current full-form API, despite automatic generation in the quick-deploy shortcut.

**Use a new agent in the right vault. Do not move an existing agent with history, reserves or queued requests.** The current **Other agents (transfer to this vault)** option reassigns the agent, and a confirmed financial defect can move accounting/history and change the signer for queued requests. This workaround avoids that path; it does not fix the defect.

If configuring policies, select C both in the top **Selected vault** control and inside **Test vault**: they are independent. For the baseline below, use no human-threshold restriction and no low-balance restriction that would conflict with `0.5 SOL` simulation. Changing policies for another selected vault will not change C’s checks.

## 6. Demonstrate three firewall outcomes without payment

1. Open **AI Simulator** and choose your new agent.
2. Enter B in **Solana Recipient Public Key** and turn **Start/Stop** on. Expect **Simulator active / LIVE**.
3. Run the following checks once each, in order:

| Action | Recipient | Expected result |
|---|---|---|
| Well-Behaved Bot (0.5 SOL) | B | `APPROVED: POLICY_PASSED`, with `SIMULATION / NOT_SUBMITTED` |
| Greedy Rogue Bot (6.0 SOL) | B | `BLOCKED: SINGLE_TX_CAP_EXCEEDED` |
| Well-Behaved Bot (0.5 SOL) | A, which is not on the list | `BLOCKED: RECIPIENT_NOT_ALLOWED` |

4. Restore B in the recipient field. Do not repeat the approved simulation until its budget is exhausted.

These checks do not send SOL. Approved simulations consume the simulator’s **UTC calendar-day** budget; blocked evaluations do not. **Clear terminal** clears displayed logs, not the persisted history/budget. The dashboard chart and block counter can include simulations; they are not proof of paid transfers.

The separate **Request Devnet Payment (0.5 SOL)** button requests an actual Devnet payment. Leave it untouched during these policy-only checks; use the smaller `0.01` payment below.

## 7. Pay B 0.01 SOL with human approval

1. Return to **Vault Budgets → Devnet Payments**. Confirm C, your new agent and **Manual approval**.
2. Fill **Devnet recipient** with B, **Payment amount (SOL)** with `0.01`, and **Purpose** with `Judges manual payment 1`. Use a dot for decimals.
3. Click **Request payment** once. Expect **Awaiting approval** in **Approval queue**, with B’s full address and `0.01 SOL`. No transfer should happen before approval.
4. Check address and amount, then click **Approve**. Approval rechecks the current policy and balance. If that recheck fails, an error is returned and the request remains PENDING; correct the condition or reject it.
5. Follow **Payment history**. **Sent to the network** and **Checking the network** are intermediate states, not success/failure conclusions.
6. When a signature is available, open **View on Solana Devnet**. Complete acceptance requires **Confirmed** in the application and a **finalized** transaction in the Explorer, with **source C**, **destination B**, and **0.01 SOL** transferred.

A signature, an HTTP 200 or human approval alone does not establish settlement. If the result is uncertain, record the request ID/available signature and check the existing request; do not create another intention or switch to the simulator’s payment button to retry.

## 8. Check rejection, pause and isolation

1. In manual mode, request another `0.01 SOL` with purpose `Judges rejection 1`; click **Reject**. Expect **Rejected**, with no transfer.
2. In Agent Fleet, click **Pause** on this agent; expect `FROZEN`. A new request should be blocked. Click **Resume** before continuing; expect `ACTIVE`. Resume does not dispatch previously blocked requests.
3. Optional mode check: create a pending manual request, then select **Automatic**. The old request must still require individual approval; reject it after checking. Return to **Manual approval**. New requests can send immediately in automatic mode.
4. Switch Phantom from A to B if you control B. The previous account’s private data should disappear; after signing in as B, it must not show A’s vaults/agents. Return to A only if you want to continue its test.
5. Sign out and reload. Private data must remain inaccessible. If B belongs to a friend, mark the second-account isolation check Not executed unless you have another account under your control.

## 9. Interpret balances and troubleshoot

The agent limit applies to its payment principal; the **vault’s rolling 24-hour limit includes principal and network fees**, plus committed reservations. Simulation budget resets at midnight UTC; real payments use a moving 24-hour window. **Available balance** subtracts reserved requests. **Reserved for requests** is not settled spend. **Spent in 24 hours** includes confirmed spend and paid fees, including failed on-chain transactions. Two `0.5 SOL` payments can exceed a `1 SOL` vault limit because of fees.

| Symptom | Meaning and next step |
|---|---|
| RECIPIENT_NOT_ALLOWED | B is missing from the agent’s required list, or the requested address differs. Edit Limits → Allowed addresses → save; use exactly B. |
| VAULT_DAILY_CAP_EXCEEDED | The vault ceiling cannot cover committed principal and fees. Check Spent/Reserved and Save limit if an intentional adjustment is needed. More balance alone does not raise the ceiling. |
| Deposit SOL → Internal Server Error | Faucet/network failure has no confirmed public cause. Check C’s balance/any signature before repeating; use the official faucet link and ask the operator for logs of this VPS/time. |
| Request recorded: Blocked | The request was recorded but not sent. The green registration message does not mean payment success. Cards currently omit error_code; ask the operator to inspect the request ID through authenticated `GET /api/payments/:id`. |
| Checking the network / UNKNOWN | The outcome is uncertain and reservations remain. Inspect the same request/Explorer and let reconciliation determine the result. Do not infer refund or make a replacement payment. |
| Missing Phantom | Use a browser with the extension; public Docs can still be reviewed. Do not mark login accepted. |
| Payment sending disabled / HTTP 501 | This deployment has not enabled the required path, or the operation is unsupported. Record Blocked by environment and ask the operator; generic withdrawals and legacy `/transactions` are intentionally disabled. |

After a **terminal block with no submission confirmed**, correcting a limit does not change the old request. Submitting the exact same fields can retrieve that old block. For a genuinely new test, use a new purpose such as `Judges payment after adjustment 2`, generating a new intention. **Never use this procedure for SUBMITTED/UNKNOWN.** After a lost transport response, keep the same fields to preserve retry identity and check history first.

## 10. Record the results and review limitations

Fill this table with actual observations; no row is preapproved:

| Check | Expected | Actual result / public evidence | Status |
|---|---|---|---|
| Phantom login | Verified owner session | To record | Not executed |
| 0.5 SOL simulation to B | Approved, NOT_SUBMITTED | To record | Not executed |
| 6 SOL simulation | Single-payment cap block | To record | Not executed |
| Simulation to A | Recipient block | To record | Not executed |
| Manual 0.01 SOL payment | Confirmed + finalized, C → B | Request ID and signature to record | Not executed |
| Reject / pause / resume | No unauthorized send; status changes persist | To record | Not executed |
| Account switch / sign-out | Owner data isolation | To record | Not executed |

Use **Pass**, **Fail**, **Blocked by environment** or **Not executed**. Record date/time, demo URL, installed revision when known, public vault/agent/request identifiers and expected/actual behavior. Do not attach session cookies, credentials or private keys.

The review found the agent-vault reassignment defect described above; it is open, not repaired by these docs. Other limitations include generic faucet errors, missing block reasons in history cards, and presentation/marketing statements that need alignment with the implemented scope. The published infrastructure’s image/commit, backup restoration and internal database readiness need operator evidence. `/readyz` returning the frontend’s HTML with HTTP 200 is not proof of PostgreSQL readiness.

On the reviewed snapshot, **109 backend tests in 13 suites**, **14 frontend tests**, both production builds and the payment browser regression passed. Browser payment scenarios used a controlled API; three separate database reproductions demonstrated the financial defect. These results do not certify a real Phantom extension flow or funded transfer on the published site; this walkthrough supplies the missing acceptance procedure.

Optional technical references: [review findings and priorities](MAIN_VPS_REVIEW_2026-10-12.md), [REST API](api/REST_API.md), [architecture](architecture/ARCHITECTURE.md), [deployment](DEPLOYMENT.md), and [VPS operation/backup runbook](VPS_RUNBOOK.md).
