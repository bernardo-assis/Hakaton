# UI API contract
All endpoints return `{success:true,data:...}`; errors `{success:false,error:string}`. Local prototype has no authentication. No custody transfer/withdrawal permitted.

- GET /api/dashboard: balanceSol (null when RPC unavailable), balanceAvailable, dailyLimitSol, spentTodaySol (CONFIRMED only), activeAgents, blockedTxs, totalAgents, vaultPubkey, vaultId, transactions, chartData.
- POST /api/dashboard/deposit `{amountSol:number}`: devnet faucet only. Returns signature; errors explicit.
- POST /api/dashboard/withdraw: 501 unsupported.
- GET /api/vaults: persisted vault list, caps and confirmed daily spending (lamports strings).
- POST /api/vaults: existing `{user_id,owner_pubkey,vault_pubkey,key_reference}`.
- PATCH /api/vaults/:id `{status:'ACTIVE'|'FROZEN'}`.
- GET /api/agents: existing fields plus spent_today_lamports, transaction_count (lamports strings).
- POST /api/agents: `{vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports?,whitelist_enabled?}`. Lamports nonnegative safe integer or digit string. Public keys valid Solana keys.
- PATCH /api/agents/:id: subset `{name,role,daily_cap_lamports,single_tx_cap_lamports,status,whitelist_enabled}`; effective single cap <= daily cap.
- POST /api/agents/panic `{}`: freezes all agents; returns `{count}`.
- GET /api/agents/:id/history: transaction list plus audit events.
- GET /api/notifications: audit event list `{id,action,reason,target_id,created_at,...}`. No fake unread counters.
- POST /api/simulator/evaluate `{agent_id,amount_lamports,recipient_pubkey,purpose?,request_id}`: policy evaluation persisted in audit events; returns `{id,decision:'APPROVED'|'BLOCKED',reason,mode:'SIMULATION',settlement_status:'NOT_SUBMITTED',amount_lamports,agent_id,created_at}`. No actual payment. Repeat request_id replays existing result, conflicting payload 409. Simulated approvals consume simulator daily budget only.
- GET /api/simulator/history: persisted simulation results newest first.
- POST /api/transactions: 501 (real transfers require authentication, authorization and safe settlement implementation).
- POST /api/vaults/local `{owner_pubkey}`: creates/reuses observed wallet vault and local identity. No custody key or authentication; intended only for local demonstration. Returns public vault metadata.
- PATCH /api/vaults/:id/policies `{pause_on_low_balance,low_balance_threshold_lamports,require_human_approval,approval_threshold_lamports,block_unlisted_recipients}`: all fields required; monetary strings. Simulator blocks with BALANCE_UNAVAILABLE/LOW_BALANCE/APPROVAL_REQUIRED/RECIPIENT_NOT_ALLOWED as appropriate. No approval workflow is simulated.
- POST /api/vaults/:id/optimize `{}`: returns balance and remaining budget in lamports plus recommendation; performs no transfer.
- PATCH /api/agents/:id/whitelist `{recipients:[{recipient_pubkey,label}]}` atomically replaces recipients (maximum 100, no duplicates). GET agents includes `recipients`.
- Simulator budgets use calendar day UTC and are separate from real confirmed spending; simulation never debits balances. UI must label this explicitly.
- Dashboard chart aggregates all transactions for seven UTC days; history itself is capped at latest 100.
- Deposit requires amountSol >0 and <=2; optional vault_id (required when multiple vaults). Only official Devnet RPC accepted. Wallet connection is observation, not authorization.
- GET /api/agents additionally returns `simulated_spent_today_lamports` (decimal string), aggregated over every approved simulation in current UTC calendar day. Simulator budget UI must consume this field, never infer budgets from paginated/history-limited events.
