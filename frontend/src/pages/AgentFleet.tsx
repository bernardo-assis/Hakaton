import { useState, useEffect } from "react";
import {
  request,
  sol,
  fromLamports,
  toLamports,
  usagePercent,
} from "../lib/api";
import type { Agent, Vault } from "../lib/api";

export function AgentFleet() {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("spending");
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "",
    role: "",
    pubkey: "",
    vault: "",
    daily: "5",
    single: "1",
    whitelist: false,
    recipients: "",
  });
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, v] = await Promise.all([
        request<Agent[]>("/agents"),
        request<Vault[]>("/vaults"),
      ]);
      setAgents(a);
      setVaults(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading agents.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const open = (agent?: Agent) => {
    setError("");
    setEditing(agent ?? null);
    setForm(
      agent
        ? {
            name: agent.name,
            role: agent.role,
            pubkey: agent.agent_pubkey,
            vault: agent.vault_id,
            daily: String(fromLamports(agent.daily_cap_lamports)),
            single: String(fromLamports(agent.single_tx_cap_lamports)),
            whitelist: agent.whitelist_enabled,
            recipients: (agent.recipients ?? [])
              .map((r) => r.recipient_pubkey)
              .join(", "),
          }
        : {
            name: "",
            role: "",
            pubkey: "",
            vault: vaults[0]?.id ?? "",
            daily: "5",
            single: "1",
            whitelist: false,
            recipients: "",
          },
    );
    setIsDeployModalOpen(true);
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const daily = toLamports(form.daily),
        single = toLamports(form.single);
      if (!form.name.trim() || !form.role.trim() || !form.vault)
        throw new Error("Enter name, role, and select a vault.");
      if (BigInt(single) > BigInt(daily))
        throw new Error("Per-transaction limit cannot exceed daily limit.");
      const recipients = [
        ...new Set(
          form.recipients
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        ),
      ].map((recipient_pubkey, i) => ({
        recipient_pubkey,
        label: `Recipient ${i + 1}`,
      }));
      if (
        recipients.some(
          (r) => !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(r.recipient_pubkey),
        )
      )
        throw new Error("Invalid allowed recipient address.");
      if (form.whitelist && !recipients.length)
        throw new Error("Add at least one allowed recipient.");
      const body = {
        name: form.name.trim(),
        role: form.role.trim(),
        vault_id: form.vault,
        daily_cap_lamports: daily,
        single_tx_cap_lamports: single,
        whitelist_enabled: form.whitelist,
      };
      const saved = await request<Agent>(
        editing ? `/agents/${editing.id}` : "/agents",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(
            editing
              ? body
              : {
                  ...body,
                  agent_pubkey: form.pubkey.trim(),
                },
          ),
        },
      );
      // Keep the editor open if configuring recipients fails, so the user can retry safely.
      setEditing(saved);
      try {
        await request(`/agents/${saved.id}/whitelist`, {
          method: "PATCH",
          body: JSON.stringify({ recipients }),
        });
      } catch (e) {
        throw new Error(
          `Agent saved. Could not update recipients: ${e instanceof Error ? e.message : "try again"}`,
        );
      }
      setIsDeployModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving agent.");
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (agent: Agent) => {
    setBusy(true);
    setError("");
    try {
      await request(`/agents/${agent.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: agent.status === "ACTIVE" ? "FROZEN" : "ACTIVE",
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error updating agent.");
    } finally {
      setBusy(false);
    }
  };
  const panic = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/agents/panic", { method: "POST", body: "{}" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error freezing agents.");
    } finally {
      setBusy(false);
    }
  };
  const visible = agents
    .filter(
      (a) =>
        (status === "ALL" || a.status === status) &&
        `${a.name} ${a.id} ${a.agent_pubkey}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : Number(b.spent_today_lamports) - Number(a.spent_today_lamports),
    );

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12 relative">
      {loading && (
        <p role="status" className="text-[#777D85] text-[13px] mb-4">
          Loading agents...
        </p>
      )}
      {error && (
        <p role="alert" className="text-[#F04448] text-[13px] mb-4">
          {error}{" "}
          <button onClick={() => void load()} className="underline cursor-pointer">
            Try again
          </button>
        </p>
      )}
      {!loading && !error && visible.length === 0 && (
        <p className="text-[#777D85] text-[13px] mb-4">
          No agents found.
        </p>
      )}
      {/* Primeira Linha: Título e Botões de Ação */}
      <div className="flex justify-between items-start mb-8">
        {/* Título e Subtítulo */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[#111827] text-[30px] font-medium font-inter">
            Agent Fleet Management
          </h1>
          <span className="text-[#777D85] text-[13px] font-normal">
            Manage budgets, policies, and security guardrails for your autonomous AI workforce
          </span>
        </div>

        {/* Botões na Coluna da Direita */}
        <div className="flex items-center gap-3">
          <button
            disabled={loading || busy}
            onClick={() => open()}
            className="bg-[#B6F03F] text-[#111827] px-5 py-2.5 rounded-full text-[13px] font-semibold hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Deploy New Agent
          </button>

          <button
            disabled={busy}
            onClick={() => void panic()}
            className="bg-[#F04448] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-red-600 hover:shadow-[0_0_15px_rgba(240,68,72,0.3)] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center gap-2"
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
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Emergency: Freeze Fleet
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-[22px] p-4 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 border border-[#E8EAEC] rounded-[10px] px-3 h-[40px] w-full sm:w-[320px] focus-within:ring-2 focus-within:ring-[#064E3B]/20 focus-within:border-[#064E3B] transition-all duration-200">
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
            placeholder="Search agents by name or ID..."
            className="bg-transparent border-none outline-none text-[13px] text-[#111827] placeholder-[#777D85] w-full"
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() =>
              setStatus((v) =>
                v === "ALL" ? "ACTIVE" : v === "ACTIVE" ? "FROZEN" : "ALL",
              )
            }
            className="flex items-center justify-between gap-2 border border-[#E8EAEC] rounded-[10px] px-4 h-[40px] hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 cursor-pointer w-full sm:w-auto"
          >
            <span className="text-[#111827] text-[13px] font-medium">
              Status: {status}
            </span>
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              setSort((v) => (v === "spending" ? "name" : "spending"))
            }
            className="flex items-center justify-between gap-2 border border-[#E8EAEC] rounded-[10px] px-4 h-[40px] hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 cursor-pointer w-full sm:w-auto"
          >
            <span className="text-[#111827] text-[13px] font-medium">
              Sort by: {sort === "spending" ? "Spending" : "Name"}
            </span>
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div>
        {/* List Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-[#111827] text-white px-2.5 py-0.5 rounded-md text-[13px] font-semibold">
            {loading || (error && agents.length === 0) ? "" : visible.length}
          </div>
          <h2 className="text-[#111827] text-[16px] font-medium">
            Active Agents in Fleet
          </h2>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default"
            >
              {/* Top: Avatar & Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-[#111827]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 bg-[#E6F8F0] px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-[#24865E] rounded-full"></div>
                  <span className="text-[#24865E] text-[11px] font-semibold">
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Identity */}
              <div className="mb-5">
                <h3 className="text-[#111827] text-[16px] font-semibold mb-1">
                  {agent.name}
                </h3>
                <p className="text-[#777D85] text-[12px] mb-3 leading-relaxed">
                  {agent.role}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[#111827] bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100 w-fit">
                  <svg
                    className="w-3.5 h-3.5 text-[#777D85]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="font-mono">
                    {agent.agent_pubkey.slice(0, 4)}...
                    {agent.agent_pubkey.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Budget Limits */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
                <div className="flex-1">
                  <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">
                    Daily Limit
                  </span>
                  <span className="text-[#111827] text-[14px] font-semibold">
                    {sol(fromLamports(agent.daily_cap_lamports))}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex-1">
                  <span className="block text-[#777D85] text-[11px] font-medium mb-0.5">
                    TX Limit
                  </span>
                  <span className="text-[#111827] text-[14px] font-semibold">
                    {sol(fromLamports(agent.single_tx_cap_lamports))}
                  </span>
                </div>
              </div>

              {/* Whitelist */}
              <div className="mb-5">
                <span className="block text-[#111827] text-[12px] font-medium mb-2.5">
                  Allowed Services & Recipients
                </span>
                <div className="flex flex-wrap gap-2">
                  {(agent.recipients ?? []).length ? (
                    agent.recipients.map((r) => (
                      <span
                        key={r.recipient_pubkey}
                        title={r.recipient_pubkey}
                        className="bg-[#F6F7F7] border border-[#E8EAEC] text-[#777D85] px-2.5 py-1 rounded-[6px] text-[11px] font-medium"
                      >
                        {r.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#777D85] text-[11px]">
                      {agent.whitelist_enabled
                        ? "No recipients whitelisted"
                        : "Recipient whitelist disabled"}
                    </span>
                  )}
                </div>
              </div>

              {/* Daily Usage */}
              <div className="mb-6 mt-auto">
                <div className="flex justify-between items-center text-[12px] mb-2">
                  <span className="text-[#111827] font-semibold">
                    {sol(fromLamports(agent.spent_today_lamports))} used
                  </span>
                  <span className="text-[#777D85]">
                    {sol(fromLamports(agent.daily_cap_lamports))} max
                  </span>
                </div>
                <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                  <div
                    className="bg-[#064E3B] h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${usagePercent(fromLamports(agent.spent_today_lamports), fromLamports(agent.daily_cap_lamports))}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => open(agent)}
                  className="flex-1 border border-[#E8EAEC] text-[#111827] py-2.5 rounded-full text-[12px] font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  Edit Limits
                </button>
                <button
                  disabled={busy}
                  onClick={() => void mutate(agent)}
                  className="flex-1 border border-[#E8EAEC] text-[#F04448] py-2.5 rounded-full text-[12px] font-semibold hover:bg-red-50 hover:border-red-100 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  {agent.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          ))}
          {/* Card 3: Adicionar Deploy Agent (Placeholder) */}
          <button
            disabled={loading || busy}
            onClick={() => open()}
            className="bg-transparent rounded-[22px] p-6 border-2 border-dashed border-[#E8EAEC] flex flex-col items-center justify-center text-center hover:border-gray-400 hover:bg-gray-50/80 active:scale-[0.99] transition-all duration-200 cursor-pointer min-h-[420px]"
          >
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <svg
                className="w-6 h-6 text-[#777D85]"
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
            </div>
            <h3 className="text-[#111827] text-[16px] font-semibold mb-1">
              Deploy Agent
            </h3>
            <p className="text-[#777D85] text-[12px] max-w-[200px]">
              Create a new autonomous agent and configure its policies for
              security.
            </p>
          </button>
        </div>
      </div>

      {/* Rodap de Confiana */}
      <div className="mt-16 flex items-center justify-center gap-2 text-[#777D85]">
        <svg
          className="w-4 h-4 text-[#B6F03F]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span className="text-[12px] font-medium tracking-wide uppercase">
          Every agent. Every transaction. Protected.
        </span>
      </div>

      {/* Modal: Deploy New Agent */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[600px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
              <h2 className="text-[#111827] text-[20px] font-semibold">
                {editing ? "Edit Agent" : "Deploy New Agent"}
              </h2>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 active:scale-[0.98] transition-all duration-200 cursor-pointer"
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

            <div className="p-6 overflow-y-auto flex flex-col gap-8">
              {error && (
                <p role="alert" className="text-[#F04448] text-[13px]">
                  {error}
                </p>
              )}
              <label className="text-[#111827] text-[13px] font-medium">
                Treasury Vault
                <select
                  value={form.vault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vault: e.target.value }))
                  }
                  className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200"
                >
                  <option value="">Select a vault...</option>
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vault_pubkey.slice(0, 8)}... — {v.status}
                    </option>
                  ))}
                </select>
              </label>
              {!loading && !error && !vaults.length && (
                <p className="text-[#777D85] text-[12px]">
                  Please create a treasury vault in Vault Budgets first.
                </p>
              )}

              {/* Seo 1: Agent Identity */}
              <div>
                <h3 className="text-[#111827] text-[15px] font-semibold mb-4">
                  Agent Identity
                </h3>

                <div className="flex flex-col gap-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                      Agent Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      type="text"
                      placeholder="Ex: Trading Bot"
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 text-[14px] text-[#111827] placeholder-[#777D85] outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200"
                    />
                  </div>

                  {/* Propsito */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                      Purpose
                    </label>
                    <input
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      type="text"
                      placeholder="Ex: Market research & data API scraping"
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 text-[14px] text-[#111827] placeholder-[#777D85] outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200"
                    />
                  </div>

                  {/* Chave Pblica */}
                  <div>
                    <label className="block text-[#111827] text-[13px] font-medium mb-1.5">
                      Solana Public Key (Wallet)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <input
                        disabled={!!editing}
                        value={form.pubkey}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, pubkey: e.target.value }))
                        }
                        type="text"
                        placeholder="Paste agent wallet public key..."
                        className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] pl-10 pr-4 py-2.5 text-[14px] font-mono text-[#111827] placeholder-[#777D85] outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Security Policies */}
              <div className="bg-[#F6F7F7] rounded-[16px] p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E8EAEC] flex items-center justify-center">
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-[#111827] text-[15px] font-semibold">
                    Security Policies
                  </h3>
                  <div className="flex items-center gap-1.5 bg-[#E6F8F0] px-2.5 py-1 rounded-full ml-auto">
                    <div className="w-1.5 h-1.5 bg-[#24865E] rounded-full"></div>
                    <span className="text-[#24865E] text-[11px] font-semibold">
                      Hard caps
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Daily Cap */}
                  <div>
                    <label className="block text-[#111827] text-[12px] font-medium mb-1.5">
                      Daily Limit (SOL)
                    </label>
                    <div className="flex items-center bg-white border border-[#E8EAEC] rounded-[10px] overflow-hidden focus-within:ring-2 focus-within:ring-[#064E3B]/20 focus-within:border-[#064E3B] transition-all duration-200">
                      <span className="pl-3 text-[#777D85] text-[14px] font-medium">
                        SOL
                      </span>
                      <input
                        value={form.daily}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, daily: e.target.value }))
                        }
                        type="text"
                        className="w-full bg-transparent px-2 py-2.5 text-[14px] text-[#111827] font-semibold outline-none"
                      />
                      <div className="flex flex-col border-l border-[#E8EAEC]">
                        <button
                          aria-label="Increase limit"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              daily: String(Number(f.daily) + 1),
                            }))
                          }
                          className="px-2 py-1 hover:bg-gray-50 active:bg-gray-100 border-b border-[#E8EAEC] transition-colors"
                        >
                          <svg
                            className="w-3 h-3 text-[#777D85]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          aria-label="Decrease limit"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              daily: String(Math.max(0, Number(f.daily) - 1)),
                            }))
                          }
                          className="px-2 py-1 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 text-[#777D85]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                              transform="rotate(180 12 12)"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Max per TX */}
                  <div>
                    <label className="block text-[#111827] text-[12px] font-medium mb-1.5">
                      Per-Transaction Limit (SOL)
                    </label>
                    <div className="flex items-center bg-white border border-[#E8EAEC] rounded-[10px] overflow-hidden focus-within:ring-2 focus-within:ring-[#064E3B]/20 focus-within:border-[#064E3B] transition-all duration-200">
                      <span className="pl-3 text-[#777D85] text-[14px] font-medium">
                        SOL
                      </span>
                      <input
                        value={form.single}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, single: e.target.value }))
                        }
                        type="text"
                        className="w-full bg-transparent px-2 py-2.5 text-[14px] text-[#111827] font-semibold outline-none"
                      />
                      <div className="flex flex-col border-l border-[#E8EAEC]">
                        <button
                          aria-label="Increase limit"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              single: String(Number(f.single) + 1),
                            }))
                          }
                          className="px-2 py-1 hover:bg-gray-50 active:bg-gray-100 border-b border-[#E8EAEC] transition-colors"
                        >
                          <svg
                            className="w-3 h-3 text-[#777D85]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          aria-label="Decrease limit"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              single: String(Math.max(0, Number(f.single) - 1)),
                            }))
                          }
                          className="px-2 py-1 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 text-[#777D85]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                              transform="rotate(180 12 12)"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <label className="text-[#111827] text-[13px] font-medium flex items-center gap-2 mb-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.whitelist}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, whitelist: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-[#064E3B] focus:ring-[#064E3B]/20 transition-all duration-200 cursor-pointer"
                />
                Restrict allowed recipients (Whitelist)
              </label>
              <label className="text-[#777D85] text-[12px]">
                Allowed addresses (comma-separated public keys)
                <textarea
                  value={form.recipients}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipients: e.target.value }))
                  }
                  placeholder="e.g. 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin, 7nYx..."
                  className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2 outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200 text-[13px] text-[#111827]"
                />
              </label>
            </div>

            {/* Footer with Button */}
            <div className="p-6 pt-4 border-t border-gray-100 mt-auto flex justify-end">
              <button
                disabled={busy}
                onClick={() => void save()}
                className="bg-[#B6F03F] text-[#111827] w-full sm:w-auto px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 hover:shadow-md active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {busy ? "Saving..." : editing ? "Save Agent" : "Deploy Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
