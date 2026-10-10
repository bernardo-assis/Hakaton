export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: string;
  } | null;
  if (!response.ok || !body?.success)
    throw new Error(
      body?.error ||
        `Não foi possível completar a solicitação (${response.status}).`,
    );
  return body.data as T;
}
export function sol(value: number | null | undefined): string {
  return value == null
    ? "Indisponível"
    : `${Number(value).toLocaleString("en-US", { maximumFractionDigits: 9 })} SOL`;
}
export function fromLamports(value: string | number | undefined): number {
  return Number(value ?? 0) / 1_000_000_000;
}
export function toLamports(value: string): string {
  if (!/^\d+(\.\d{1,9})?$/.test(value.trim()))
    throw new Error("Informe um valor SOL válido, com até 9 casas decimais.");
  const [whole, fraction = ""] = value.trim().split(".");
  const amount =
    BigInt(whole) * 1_000_000_000n + BigInt(fraction.padEnd(9, "0"));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error("Valor SOL excede o limite permitido.");
  return amount.toString();
}
export function usagePercent(spent: number, cap: number): number {
  return cap > 0 ? Math.min(100, Math.max(0, (spent / cap) * 100)) : 0;
}
export interface Policies {
  pause_on_low_balance: boolean;
  low_balance_threshold_lamports: string;
  require_human_approval: boolean;
  approval_threshold_lamports: string;
  block_unlisted_recipients: boolean;
}
export interface Vault {
  id: string;
  owner_pubkey: string;
  vault_pubkey: string;
  status: "ACTIVE" | "FROZEN";
  daily_cap_lamports: string;
  spent_today_lamports: string;
  balance_lamports: string | null;
  policies?: Policies;
}
export interface Agent {
  id: string;
  vault_id: string;
  name: string;
  role: string;
  agent_pubkey: string;
  status: "ACTIVE" | "FROZEN";
  daily_cap_lamports: string;
  single_tx_cap_lamports: string;
  spent_today_lamports: string;
  simulated_spent_today_lamports: string;
  transaction_count: number;
  whitelist_enabled: boolean;
  recipients: { recipient_pubkey: string; label: string }[];
  created_at: string;
}
export interface Transaction {
  id: string;
  agent_id: string;
  agent_name?: string;
  purpose?: string;
  amountSol: number;
  status: string;
  settlement_status?: string;
}
export interface DashboardData {
  balanceSol: number | null;
  balanceAvailable: boolean;
  dailyLimitSol: number;
  spentTodaySol: number;
  activeAgents: number;
  blockedTxs: number;
  totalAgents: number;
  vaultPubkey: string | null;
  vaultId: string | null;
  transactions: Transaction[];
  vaults: Vault[];
  chartData: { date: string; approved: number; blocked: number }[];
}
export interface AuditEvent {
  id: string;
  action: string;
  reason?: string;
  target_id: string;
  created_at: string;
}
export interface Simulation {
  id: string;
  decision: "APPROVED" | "BLOCKED";
  reason: string;
  mode: "SIMULATION";
  settlement_status: "NOT_SUBMITTED";
  amount_lamports: string;
  agent_id: string;
  created_at: string;
}
