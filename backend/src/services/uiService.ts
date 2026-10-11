import { UiRepository } from "../repositories/UiRepository";
import { SolanaService } from "./solanaService";
export class UiService {
  constructor(
    private repo = new UiRepository(),
    private solana = new SolanaService(),
  ) {}
  async deposit(vaultId: string | undefined, amountSol: number) {
    const vaults = await this.repo.vaults();
    const vault = vaultId
      ? vaults.find((v) => v.id === vaultId)
      : vaults.length === 1
        ? vaults[0]
        : undefined;
    if (!vault)
      throw Object.assign(
        new Error(
          vaultId
            ? "Not found"
            : "Select an existing vault for the Devnet faucet",
        ),
        { status: vaultId ? 404 : 400 },
      );
    return {
      signature: await this.solana.requestAirdrop(
        vault.vault_pubkey,
        amountSol,
      ),
    };
  }
  async balance(pubkey: string) {
    try {
      return await this.solana.getBalance(pubkey);
    } catch {
      return null;
    }
  }
  async vaults() {
    return Promise.all(
      (await this.repo.vaults()).map(async (v) => ({
        ...v,
        balance_lamports: await this.balance(v.vault_pubkey),
      })),
    );
  }
  whitelist(id: string, recipients: any[]) {
    return this.repo.whitelist(id, recipients);
  }
  agents() {
    return this.repo.agents();
  }
  events() {
    return this.repo.events();
  }
  history(id: string) {
    return this.repo.history(id);
  }
  mutate(kind: "agents" | "vaults", id: string, input: any) {
    return this.repo.mutate(kind, id, input);
  }
  panic() {
    return this.repo.panic();
  }
  async dashboard() {
    const vaults = await this.vaults();
    const agents = await this.agents();
    const transactions = await this.repo.transactions();
    const stats = await this.repo.stats();
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 6 + i);
      const date = d.toISOString().slice(0, 10);
      const day = stats.chart.find((t) => t.date === date);
      return { date, approved: day?.approved ?? 0, blocked: day?.blocked ?? 0 };
    });
    const balances = vaults.map((v) => v.balance_lamports);
    const total = balances.every((b) => b !== null)
      ? balances.reduce((n, b) => n + BigInt(b!), 0n)
      : null;
    return {
      vaults,
      vaultId: vaults[0]?.id ?? null,
      vaultPubkey: vaults[0]?.vault_pubkey ?? null,
      balanceAvailable: total !== null,
      balanceSol: total === null ? null : Number(total) / 1e9,
      balanceLamports: total?.toString() ?? null,
      dailyLimitSol:
        vaults.reduce((n, v) => n + Number(v.daily_cap_lamports), 0) / 1e9,
      spentTodaySol:
        agents.reduce((n, a) => n + Number(a.spent_today_lamports), 0) / 1e9,
      activeAgents: agents.filter((a) => a.status === "ACTIVE").length,
      totalAgents: agents.length,
      blockedTxs: stats.blocked,
      transactions: transactions.map((t) => ({
        ...t,
        amountSol: Number(t.amount_lamports) / 1e9,
        status: t.decision,
        date: t.created_at,
      })),
      chartData,
    };
  }
  async simulate(input: any) {
    return this.repo.simulate(input, async (a, p, spent, listed) => {
      const amount = BigInt(input.amount_lamports);
      if (a.status !== "ACTIVE") return "AGENT_FROZEN";
      if (a.vault_status !== "ACTIVE") return "VAULT_FROZEN";
      if (amount > BigInt(a.single_tx_cap_lamports))
        return "SINGLE_TX_CAP_EXCEEDED";
      if (spent + amount > BigInt(a.daily_cap_lamports))
        return "DAILY_CAP_EXCEEDED";
      if ((a.whitelist_enabled || p.block_unlisted_recipients) && !listed)
        return "RECIPIENT_NOT_ALLOWED";
      if (
        p.require_human_approval &&
        amount > BigInt(p.approval_threshold_lamports)
      )
        return "APPROVAL_REQUIRED";
      if (p.pause_on_low_balance) {
        const balance = await this.balance(a.vault_pubkey);
        if (balance === null) return "BALANCE_UNAVAILABLE";
        if (BigInt(balance) - amount < BigInt(p.low_balance_threshold_lamports))
          return "LOW_BALANCE";
      }
      return null;
    });
  }
  async simulations() {
    return this.repo.simulations();
  }
  localVault(pubkey: string) {
    return this.repo.localVault(pubkey);
  }
  async optimize(id: string) {
    const vault = (await this.vaults()).find((v) => v.id === id);
    if (!vault)
      throw Object.assign(new Error("Vault not found"), { status: 404 });
    const remaining =
      BigInt(vault.daily_cap_lamports) - BigInt(vault.spent_today_lamports);
    return {
      vault_id: id,
      remaining_budget_lamports: (remaining < 0n ? 0n : remaining).toString(),
      balance_lamports: vault.balance_lamports,
      recommendation:
        vault.balance_lamports === null
          ? "Balance unavailable; retry RPC before allocating funds."
          : BigInt(vault.balance_lamports) < remaining
            ? "Available balance is below remaining daily caps. Consider lowering caps or funding your wallet."
            : "Available balance covers remaining daily caps.",
      transferred: false,
    };
  }
}
