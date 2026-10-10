import { useState, useEffect } from "react";
import { request, sol, fromLamports } from "../lib/api";
import type { DashboardData, Agent, Transaction } from "../lib/api";

export function Dashboard({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [month] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<DashboardData | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [depositVaultId, setDepositVaultId] = useState("");
  const [depositAmount, setDepositAmount] = useState("1.00");
  const [withdrawAmount, setWithdrawAmount] = useState("1.00");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [overview, fleet] = await Promise.all([
        request<DashboardData>("/dashboard"),
        request<Agent[]>("/agents"),
      ]);
      setData(overview);
      setAgents(fleet);
      setDepositVaultId((id) =>
        overview.vaults.some((v) => v.id === id)
          ? id
          : (overview.vaultId ?? ""),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No foi possvel carregar o dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const balance = sol(data?.balanceSol);
  const dailyLimit = data?.dailyLimitSol ?? 0;
  const spentToday = data?.spentTodaySol ?? 0;
  const activeAgents = data?.activeAgents ?? 0;
  const blockedTxs = data?.blockedTxs ?? 0;
  const chartData = data?.chartData ?? [];
  const transactions = (data?.transactions ?? []).filter(
    (tx: Transaction) =>
      (filter === "ALL" || tx.status === filter) &&
      `${tx.id} ${tx.agent_name ?? ""} ${tx.purpose ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const handleDeposit = () => {
    setError("");
    setIsDepositModalOpen(true);
  };
  const handleWithdraw = () => {
    setError("");
    setIsWithdrawModalOpen(true);
  };
  const submitDeposit = async () => {
    if (!Number.isFinite(Number(depositAmount)) || Number(depositAmount) <= 0) {
      setError("Informe um valor SOL positivo.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const result = await request<{ signature?: string }>(
        "/dashboard/deposit",
        {
          method: "POST",
          body: JSON.stringify({
            amountSol: Number(depositAmount),
            vault_id: depositVaultId,
          }),
        },
      );
      setMessage(
        `Solicitao Devnet: ${result.signature ?? "faucet solicitado"}. Confira o saldo atualizado.`,
      );
      setIsDepositModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no faucet Devnet.");
    } finally {
      setIsLoading(false);
    }
  };
  const submitWithdraw = async () => {
    setError("");
    try {
      await request("/dashboard/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amountSol: Number(withdrawAmount),
          recipient: withdrawAddress,
        }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saque indisponvel.");
    }
  };
  const freeze = async (id: string) => {
    setError("");
    try {
      await request(`/agents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "FROZEN" }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No foi possvel congelar.");
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12">
      {isLoading && (
        <p role="status" className="text-[#777D85] text-[13px] mb-4">
          Carregando dados...
        </p>
      )}
      {error && (
        <p role="alert" className="text-[#F04448] text-[13px] mb-4">
          {error} {data && <span>Dados da ltima atualizao.</span>}{" "}
          <button onClick={() => void load()} className="underline">
            Tentar novamente
          </button>
        </p>
      )}
      {message && (
        <p role="status" className="text-[#24865E] text-[13px] mb-4">
          {message}
        </p>
      )}
      {data && !data.vaultId && (
        <p className="text-[#777D85] text-[13px] mb-4">
          Nenhum cofre cadastrado.{" "}
          <button onClick={() => onNavigate("vault")} className="underline">
            Cadastrar carteira Devnet
          </button>
        </p>
      )}
      {/* Greeting */}
      <div className="flex items-baseline gap-2 mb-8">
        <h1 className="text-[#111827] text-[30px] font-medium font-inter">
          Good morning, Founder
        </h1>
        <span className="text-[#777D85] text-[13px] font-normal">
          - Fleet Security & Budget Control
        </span>
      </div>

      {/* Grid Principal (3 Colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Cofre + Daily Limit */}
        <div className="flex flex-col gap-6">
          {/* Carto: Total Vault Balance */}
          <div className="bg-[#064E3B] rounded-[22px] p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[#A5C0B4] text-[13px] font-medium">
                Total Vault Balance
              </span>
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
                <svg
                  className="w-3 h-3 text-[#B6F03F]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="text-[#B6F03F] text-[10px] font-semibold">
                  Policy controls
                </span>
              </div>
            </div>
            <div className="mb-1">
              <h2 className="text-white text-[30px] font-normal tracking-tight">
                {balance}
              </h2>
            </div>
            <div className="mb-6">
              <span className="text-[#A5C0B4] text-[12px]">
                SOL  Solana Devnet
              </span>
            </div>
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleDeposit}
                className="flex-1 bg-[#B6F03F] text-[#111827] flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                Deposit SOL
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 bg-white/10 text-white flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold hover:bg-white/20 transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                Withdraw
              </button>
            </div>
            <div className="bg-[#054030] rounded-2xl p-4 mt-auto">
              <div className="text-[#A5C0B4] text-[11px] mb-3 flex items-center gap-1.5">
                <span>Vaults</span>
                <span className="text-white/20">|</span>
                <span>SOL / poltica / histrico</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#B6F03F]/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#B6F03F]"></div>
                    </div>
                    <span className="text-[#A5C0B4] text-[11px] font-medium">
                      SOL
                    </span>
                  </div>
                  <div className="text-white text-[13px] font-semibold mb-0.5">
                    {sol(data?.balanceSol)}
                  </div>
                  <div className="text-[#B6F03F] text-[9px] font-medium">
                    Devnet
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-[#B6F03F]/20 flex items-center justify-center">
                      <span className="text-[#B6F03F] text-[8px] font-bold">
                        $
                      </span>
                    </div>
                    <span className="text-[#A5C0B4] text-[11px] font-medium">
                      Limite
                    </span>
                  </div>
                  <div className="text-white text-[13px] font-semibold mb-0.5">
                    {sol(dailyLimit)}
                  </div>
                  <div className="text-[#B6F03F] text-[9px] font-medium">
                    Devnet
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-[#B6F03F]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="text-[#A5C0B4] text-[11px] font-medium">
                      Gasto
                    </span>
                  </div>
                  <div className="text-white text-[13px] font-semibold mb-0.5">
                    {data ? sol(spentToday) : ""}
                  </div>
                  <div className="text-[#B6F03F] text-[9px] font-medium">
                    Devnet
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carto: Fleet Daily Limit */}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[#111827] text-[15px] font-medium">
                Fleet Daily Limit
              </h3>
              <span className="text-[#777D85] text-[11px] font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                Hard cap enabled
              </span>
            </div>
            <div>
              <div className="w-full bg-[#F6F7F7] rounded-full h-[10px] mb-3 overflow-hidden">
                <div
                  className="bg-[#064E3B] h-full rounded-full"
                  style={{
                    width: `${dailyLimit > 0 ? Math.min((spentToday / dailyLimit) * 100, 100) : 0}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[12px]">
                <span className="text-[#111827] font-semibold">
                  {data ? sol(spentToday) : ""} spent today
                </span>
                <span className="text-[#777D85] font-medium">
                  {data ? sol(dailyLimit) : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Metrics + Virtual Cards */}
        <div className="flex flex-col gap-6">
          {/* Grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#064E3B] rounded-[14px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white text-[13px] font-medium">
                  Active Agents
                </span>
                <div className="bg-white/10 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-white text-[30px] font-semibold mb-1">
                  {data ? activeAgents : ""}
                </div>
                <div className="text-[#A5C0B4] text-[11px] font-medium flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>{" "}
                  {
                    agents.filter((a) => a.created_at.slice(0, 7) === month)
                      .length
                  }{" "}
                  cadastrados este ms
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[14px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#111827] text-[13px] font-medium">
                  Today's Spent
                </span>
                <div className="bg-gray-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 text-[#777D85]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-[#111827] text-[30px] font-semibold mb-1">
                  {data ? sol(spentToday) : ""}
                </div>
                <div className="text-[#24865E] text-[11px] font-medium flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>{" "}
                  Gastos confirmados
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[14px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#111827] text-[13px] font-medium">
                  Blocked Txs
                </span>
                <div className="bg-gray-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 text-[#777D85]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-[#111827] text-[30px] font-semibold mb-1">
                  {data ? blockedTxs : ""}
                </div>
                <div className="text-[#F04448] text-[11px] font-medium">
                  Over-budget attempts
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[14px] p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#111827] text-[13px] font-medium">
                  Coverage
                </span>
                <div className="bg-gray-50 rounded-full p-1.5">
                  <svg
                    className="w-4 h-4 text-[#777D85]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-[#111827] text-[30px] font-semibold mb-1">
                  {agents.length
                    ? `${Math.round((activeAgents / agents.length) * 100)}%`
                    : ""}
                </div>
                <div className="text-[#777D85] text-[11px] font-medium">
                  Agentes ativos
                </div>
              </div>
            </div>
          </div>

          {/* Virtual Cards (Agent Cards) */}
          <div className="bg-white rounded-[22px] p-5 shadow-sm border border-gray-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="border border-[#E8EAEC] p-1.5 rounded-full">
                  <svg
                    className="w-4 h-4 text-[#111827]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-[#111827] text-[15px] font-medium">
                  Agent Cards
                </h3>
              </div>
              <button
                onClick={() => onNavigate("fleet")}
                className="bg-[#F6F7F7] px-3 py-1.5 rounded-full text-[12px] font-medium flex items-center gap-1 hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Novo
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
              {agents.length === 0 && (
                <p className="text-[#777D85] text-[12px]">
                  Nenhum agente cadastrado.
                </p>
              )}
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="min-w-[190px] rounded-[14px] p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(57, 69, 63, 1) 0%, rgba(28, 41, 35, 1) 40%, rgba(16, 25, 22, 1) 100%)",
                  }}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-white text-[13px] font-medium">
                      {agent.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-white/50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="relative z-10 my-4">
                    <div className="text-[#A5C0B4] text-[11px] mb-1">
                      Cap: {sol(fromLamports(agent.daily_cap_lamports))}/dia
                    </div>
                    <div className="text-white text-[15px] font-mono tracking-[0.2em]">
                      {agent.agent_pubkey.slice(0, 4)}
                      {agent.agent_pubkey.slice(-4)}
                    </div>
                  </div>
                  <button
                    onClick={() => void freeze(agent.id)}
                    disabled={isLoading || agent.status === "FROZEN"}
                    className="bg-[#F04448] hover:bg-red-600 transition-colors text-white text-[11px] py-1.5 rounded-full font-medium w-full flex justify-center items-center gap-1.5 relative z-10 cursor-pointer"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {agent.status === "FROZEN" ? "Frozen" : "Emergency Freeze"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 3: Chart */}
        <div className="bg-white rounded-[22px] p-5 shadow-sm flex flex-col border border-gray-100">
          <div className="mb-4">
            <h3 className="text-[#111827] text-[16px] font-medium mb-1">
              Daily Transaction Volume
            </h3>
            <p className="text-[#777D85] text-[11px]">
              Fleet activity in the last 7 days
            </p>
          </div>
          <div className="bg-[#F6F7F7] rounded-[14px] p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[#111827] text-[11px] font-medium">
                Approveds vs Blockeds
              </span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-[#B6F03F]"></div>
                  <span className="text-[#777D85] text-[10px]">Approveds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-[#F04448]"></div>
                  <span className="text-[#777D85] text-[10px]">Blockeds</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex gap-2">
              <div className="flex flex-col justify-between text-[#777D85] text-[10px] pr-2 pb-5">
                {(() => {
                  const maxScale = Math.max(
                    10,
                    ...chartData.map((d) => d.approved + d.blocked),
                  );
                  return (
                    <>
                      <span>{Math.round(maxScale)}</span>
                      <span>{Math.round(maxScale * 0.8)}</span>
                      <span>{Math.round(maxScale * 0.6)}</span>
                      <span>{Math.round(maxScale * 0.4)}</span>
                      <span>{Math.round(maxScale * 0.2)}</span>
                      <span>0</span>
                    </>
                  );
                })()}
              </div>
              <div className="flex-1 border-b border-l border-[#E8EAEC] flex items-end justify-between px-2 pb-0 relative">
                <div className="absolute inset-0 flex flex-col justify-between pb-5 z-0">
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                  <div className="border-t border-[#E8EAEC] w-full"></div>
                </div>
                {chartData.map((day, idx) => {
                  const total = day.approved + day.blocked;
                  // Max height scale: let's assume max 100 txs per day. If higher, we scale.
                  const maxScale = Math.max(
                    10,
                    ...chartData.map((d) => d.approved + d.blocked),
                  );
                  const heightPercent =
                    total === 0 ? 0 : Math.min((total / maxScale) * 100, 100);
                  const approvedPercent =
                    total === 0 ? 0 : (day.approved / total) * 100;
                  const blockedPercent =
                    total === 0 ? 0 : (day.blocked / total) * 100;
                  return (
                    <div
                      key={idx}
                      className="relative z-10 w-4 flex flex-col justify-end"
                      style={{ height: heightPercent + "%" }}
                    >
                      {day.blocked > 0 && (
                        <div
                          className="w-full bg-[#F04448] rounded-t-sm"
                          style={{ height: blockedPercent + "%" }}
                        ></div>
                      )}
                      {day.approved > 0 && (
                        <div
                          className={
                            "w-full bg-[#B6F03F] " +
                            (day.blocked === 0 ? "rounded-t-sm " : "") +
                            "rounded-b-sm"
                          }
                          style={{ height: approvedPercent + "%" }}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Transaes */}
      <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[#111827] text-[16px] font-medium">
            Recent Transactions
          </h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-[#E8EAEC] rounded-[10px] px-3 h-[34px]">
              <svg
                className="w-4 h-4 text-[#777D85]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search transactions"
                className="bg-transparent border-none outline-none text-[12px] text-[#111827] placeholder-[#777D85] w-[140px]"
              />
            </div>
            <button
              onClick={() =>
                setFilter((f) =>
                  f === "ALL"
                    ? "APPROVED"
                    : f === "APPROVED"
                      ? "BLOCKED"
                      : "ALL",
                )
              }
              className="flex items-center gap-2 border border-[#E8EAEC] rounded-[10px] px-3 h-[34px] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span className="text-[#111827] text-[12px] font-medium">
                Filter: {filter}
              </span>
              <svg
                className="w-4 h-4 text-[#111827]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="border border-[#E8EAEC] rounded-[10px] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F6F7F7] border-b border-[#E8EAEC]">
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium w-[40px]">
                  <input
                    aria-label="Selecionar todas as transaes"
                    type="checkbox"
                    checked={
                      transactions.length > 0 &&
                      transactions.every((tx) => selected.includes(tx.id))
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? transactions.map((tx) => tx.id) : [],
                      )
                    }
                    className="rounded-sm border-[#E8EAEC]"
                  />
                </th>
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium">
                  ID
                </th>
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium">
                  Agent Name
                </th>
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium">
                  Service
                </th>
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium">
                  Amount
                </th>
                <th className="py-3 px-4 text-[#777D85] text-[11px] font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-gray-500 text-sm"
                  >
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#E8EAEC] hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 w-[40px]">
                      <input
                        aria-label={`Selecionar transao ${tx.id}`}
                        type="checkbox"
                        checked={selected.includes(tx.id)}
                        onChange={(e) =>
                          setSelected((ids) =>
                            e.target.checked
                              ? [...ids, tx.id]
                              : ids.filter((id) => id !== tx.id),
                          )
                        }
                        className="rounded-sm border-[#E8EAEC]"
                      />
                    </td>
                    <td className="py-3 px-4 text-[#111827] text-[12px] font-medium">
                      {tx.id.substring(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                          A
                        </div>
                        <span className="text-[#111827] text-[12px]">
                          {tx.agent_name ?? tx.agent_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#111827] text-[12px]">
                          {tx.purpose || "Solana Transfer"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#111827] text-[12px] font-medium">
                      {sol(tx.amountSol)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          "px-2 py-1 rounded-[4px] text-[10px] font-semibold " +
                          (tx.settlement_status === "CONFIRMED"
                            ? "bg-[#E6F8F0] text-[#24865E]"
                            : tx.status === "BLOCKED" ||
                                tx.settlement_status === "FAILED"
                              ? "bg-[#FEF3F2] text-[#F04448]"
                              : "bg-gray-100 text-[#777D85]")
                        }
                      >
                        {tx.status}
                        {tx.settlement_status
                          ? `  ${tx.settlement_status}`
                          : ""}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {isDepositModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
              <h2 className="text-[#111827] text-[20px] font-semibold">
                Deposit SOL
              </h2>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {error && (
                <p role="alert" className="text-[#F04448] text-[13px]">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                  Cofre
                  <select
                    value={depositVaultId}
                    onChange={(e) => setDepositVaultId(e.target.value)}
                    className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2 mb-4"
                  >
                    <option value="">Selecione</option>
                    {data?.vaults.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vault_pubkey.slice(0, 8)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                  Amount to Deposit (SOL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-[#777D85] font-medium text-[14px]">
                      ?
                    </span>
                  </div>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] text-[#111827] font-semibold outline-none focus:border-[#064E3B] transition-colors"
                  />
                </div>
                <p className="text-[#777D85] text-[11px] mt-2">
                  Faucet de teste Devnet. Sujeito  disponibilidade; no
                  deposita dinheiro real.
                </p>
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={submitDeposit}
                disabled={isLoading}
                className="bg-[#B6F03F] text-[#111827] w-full px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                {isLoading ? "Processing..." : "Confirm Deposit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[400px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
              <h2 className="text-[#111827] text-[20px] font-semibold">
                Withdraw Funds
              </h2>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {error && (
                <p role="alert" className="text-[#F04448] text-[13px]">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                  Destination Address
                </label>
                <input
                  type="text"
                  placeholder="Solana Wallet Address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 text-[14px] text-[#111827] placeholder-[#777D85] outline-none focus:border-[#064E3B] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                  Amount to Withdraw (SOL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-[#777D85] font-medium text-[14px]">
                      ?
                    </span>
                  </div>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] text-[#111827] font-semibold outline-none focus:border-[#064E3B] transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={submitWithdraw}
                className="bg-[#064E3B] text-white w-full px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
              >
                Consultar disponibilidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
