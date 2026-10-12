import { useState, useEffect } from "react";
import { request, sol, fromLamports, usagePercent } from "../lib/api";
import type { Agent, Simulation, Vault } from "../lib/api";
import { useWalletAuth } from "../components/WalletAuth";
import { explorerLink, paymentLabel, submitOwnerPayment } from "../lib/payments";
import type { Payment } from "../lib/payments";
import { SimulationControl } from "../lib/simulationControl";

export function Simulator() {
  const auth = useWalletAuth();
  const [vaults, setVaults] = useState<(Vault & { signer_ready?: boolean })[]>([]);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [control] = useState(() => new SimulationControl(localStorage));
  const [running, setRunning] = useState(control.running);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState(
    localStorage.getItem("agentsafe.simulator.agent") ?? "",
  );
  const [history, setHistory] = useState<Simulation[]>([]);
  const [logs, setLogs] = useState<
    { time: string; type: string; text: string }[]
  >([]);
  const [recipient, setRecipient] = useState(
    localStorage.getItem("agentsafe.simulator.recipient") ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [a, h, v] = await Promise.all([
        request<Agent[]>("/agents"),
        request<Simulation[]>("/simulator/history"),
        request<(Vault & { signer_ready?: boolean })[]>("/vaults"),
      ]);
      setAgents(a);
      setVaults(v);
      setHistory(h);
      setAgentId((id) =>
        a.some((agent) => agent.id === id) ? id : (a[0]?.id ?? ""),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not load simulations.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    return () => control.cancel();
  }, [control]);
  useEffect(() => {
    localStorage.setItem("agentsafe.simulator.agent", agentId);
  }, [agentId]);
  useEffect(() => {
    localStorage.setItem("agentsafe.simulator.recipient", recipient);
  }, [recipient]);
  const agent = agents.find((a) => a.id === agentId);
  const paymentVault = vaults.find(v => v.id === agent?.vault_id && v.signer_ready);
  useEffect(() => {
    if (!lastPayment || ["CONFIRMED", "FAILED"].includes(lastPayment.settlement_status) || lastPayment.approval_status === "REJECTED" || lastPayment.decision === "BLOCKED") return;
    let active = true;
    const timer = setInterval(() => {
      void request<Payment>(`/payments/${lastPayment.id}`)
        .then(p => { if (active) setLastPayment(p); })
        .catch(() => { if (active) setError("Payment status could not be refreshed. Open Vault Budgets to check before submitting another request."); });
    }, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [lastPayment?.id, lastPayment?.settlement_status, lastPayment?.approval_status, lastPayment?.decision]);
  const totalBudget = fromLamports(agent?.daily_cap_lamports);
  const usedBudget = fromLamports(agent?.simulated_spent_today_lamports);
  const append = (type: string, text: string) =>
    setLogs((prev) => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type, text },
    ]);
  const trigger = async (amount: string) => {
    if (!running || busy) return;
    if (!agentId || !recipient.trim()) {
      setError(
        "Please select an agent and enter a recipient to evaluate policies.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const signal = control.begin();
    append(
      "action",
      `[ACTION] Evaluating ${fromLamports(amount)} SOL policy check (simulation mode).`,
    );
    try {
      const result = await request<Simulation>("/simulator/evaluate", {
        method: "POST",
        signal,
        body: JSON.stringify({
          agent_id: agentId,
          amount_lamports: amount,
          recipient_pubkey: recipient.trim(),
          purpose: "UI policy simulation",
          request_id: crypto.randomUUID(),
        }),
      });
      if (signal.aborted) return;
      setHistory((prev) => [result, ...prev]);
      setAgents(await request<Agent[]>("/agents", { signal }));
      append(
        result.decision === "APPROVED" ? "success" : "error",
        `[SIMULATION / ${result.settlement_status}] ${result.decision}: ${result.reason}`,
      );
    } catch (e) {
      if (!signal.aborted) {
        const text = e instanceof Error ? e.message : "Evaluation error.";
        setError(text);
        append("error", text);
      }
    } finally {
      if (!signal.aborted) setBusy(false);
    }
  };
  const triggerGoodBot = () => void trigger("500000000");
  const triggerGreedyBot = () => void trigger("6000000000");
  const triggerReal = async (amount: string) => {
    if (!running || busy) return;
    if (!agentId || !recipient.trim() || !paymentVault) {
      setError("Select an agent attached to a separate test vault and enter a Devnet recipient.");
      return;
    }
    setBusy(true);
    setError("");
    append("action", `[PAYMENT] Requesting ${fromLamports(amount)} test SOL from the separate Devnet vault.`);
    try {
      const result = await submitOwnerPayment(localStorage, `${auth.session?.owner_pubkey}:${paymentVault.id}:simulator`, {
        agent_id: agentId,
        amount_lamports: amount,
        recipient_pubkey: recipient.trim(),
        purpose: "Hackathon Devnet payment request",
        idempotency_key: "draft",
      });
      setLastPayment(result);
      const rejected = result.decision === "BLOCKED" || result.approval_status === "REJECTED" || result.settlement_status === "FAILED";
      append(rejected ? "blocked" : result.settlement_status === "CONFIRMED" ? "approved" : "system", `[PAYMENT] ${paymentLabel(result)}. Request: ${result.id}`);
      if (result.approval_status === "PENDING") append("system", "Approve this request in Vault Budgets. Switching to automatic does not release earlier queued requests.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Payment request failed.";
      setError(message);
      append("blocked", `[PAYMENT ERROR] ${message}. A retry reuses the same request identity.`);
    } finally {
      setBusy(false);
    }
  };
  const toggle = () => {
    if (running) {
      control.stop();
      setBusy(false);
    } else control.start();
    setRunning(control.running);
    append(
      "system",
      control.running
        ? "Simulator started; trigger an agent action to evaluate."
        : "Simulator stopped. Completed evaluation requests remain in history.",
    );
    if (!control.running) void load();
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-6 pb-12 h-[calc(100vh-100px)]">
      {/* Top Header do Simulador */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[#111827] text-[24px] font-medium font-inter">
              AgentSafe AI Simulator
            </h1>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider">
              SOLANA DEVNET
            </span>
          </div>
          <p className="text-[#777D85] text-[13px]">
            Real policy engine validation on backend. Simulations do not transfer SOL.
          </p>
        </div>
        <button
          onClick={() => {
            setLogs([]);
            setError("");
            void load();
          }}
          className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-full text-[12px] font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 ease-out cursor-pointer shadow-sm"
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
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Clear terminal
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Painel de Controle Humano (Esquerda) */}
        <div className="w-full lg:w-[500px] flex flex-col gap-6">
          <div>
            <h2 className="text-gray-500 text-[11px] font-bold tracking-wider mb-2">
              HUMAN CONTROL / AGENTSAFE FIREWALL
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[#111827] text-[14px] font-semibold">
                {running ? "Simulator active" : "Simulator stopped"}
              </span>
            </div>
          </div>

          {loading && (
            <p role="status" className="text-[#777D85] text-[12px]">
              Loading...
            </p>
          )}
          {error && (
            <p role="alert" className="text-[#F04448] text-[12px]">
              {error}{" "}
              <button className="underline" onClick={() => void load()}>
                Try again
              </button>
            </p>
          )}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100">
            <label className="text-[#111827] text-[12px]">
              Agent
              <select
                disabled={busy}
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-3 py-2 mt-2 outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200 disabled:opacity-50"
              >
                <option value="">Select agent...</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}  {a.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[#111827] text-[12px] mt-4">
              Solana Recipient Public Key
              <input
                disabled={busy}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Devnet public address (e.g. 9xQe...)"
                className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-3 py-2 mt-2 outline-none focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] transition-all duration-200 disabled:opacity-50"
              />
            </label>
            {!loading && !error && !agents.length && (
              <p className="text-[#777D85] text-[12px] mt-3">
                Register a vault and an agent to get started.
              </p>
            )}
          </div>
          {/* Carto de Oramento Dirio */}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[#111827] text-[15px] font-medium">
                Daily Limit: {agent ? sol(totalBudget) : ""}
              </h3>
              <span className="text-[#24865E] text-[11px] font-medium bg-[#E6F8F0] px-2 py-1 rounded-full">
                Hard cap on
              </span>
            </div>

            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[#111827] text-[32px] font-semibold tracking-tight">
                  {agent ? sol(usedBudget) : ""}{" "}
                  <span className="text-[20px]">simulated</span>
                </span>
              </div>
              <span className="text-gray-400 font-medium text-[14px]">
                {usagePercent(usedBudget, totalBudget).toFixed(0)}%
              </span>
            </div>

            <div className="w-full bg-[#F6F7F7] rounded-full h-[10px] mb-3 overflow-hidden">
              <div
                className="bg-[#B6F03F] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${usagePercent(usedBudget, totalBudget)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[12px] font-medium text-gray-500">
              <span>
                {agent ? sol(Math.max(0, totalBudget - usedBudget)) : ""}{" "}
                remaining
              </span>
              <span>Resets at 00:00 UTC</span>
            </div>
          </div>

          {/* Botes de Ao para Demo */}
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col">
            <h3 className="text-[#111827] text-[14px] font-semibold mb-4">
              Trigger Agent Behaviors
            </h3>
            <div className="flex gap-3">
              <button
                disabled={!running || busy || !agent}
                onClick={triggerGoodBot}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[13px] font-semibold hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Well-Behaved Bot (0.5 SOL)
              </button>
              <button
                disabled={!running || busy || !agent}
                onClick={triggerGreedyBot}
                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-[13px] font-semibold hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Greedy Rogue Bot (6.0 SOL)
                </button>
              </div>
              <button
                disabled={!running || busy || !agent || !paymentVault}
                onClick={() => void triggerReal("500000000")}
                className="w-full mt-3 bg-[#111827] text-white rounded-[14px] p-4 text-left hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-[14px] text-[#B6F03F]">
                    🔥 Request Devnet Payment (0.5 SOL)
                  </h4>
                  <p className="text-gray-400 text-[12px] mt-1">
                    Uses the separate test vault. Automatic mode can send test SOL immediately; manual mode queues it for approval.
                  </p>
                </div>
              </button>
              {!paymentVault && <p className="text-gray-500 text-[12px] mt-3">Create a test vault in Vault Budgets and select an agent attached to it to request a payment.</p>}
              {lastPayment && <p role="status" className="text-gray-500 text-[12px] mt-3">Payment: {paymentLabel(lastPayment)}. <span className="break-all">{lastPayment.id}</span>{explorerLink(lastPayment.solana_signature ?? "") && <a className="underline text-[#24865E] ml-2" href={explorerLink(lastPayment.solana_signature ?? "")!} target="_blank" rel="noreferrer">View on Solana Devnet</a>}</p>}
            </div>
          </div>

        {/* Terminal do Agente de IA (Direita) */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <h2 className="text-gray-500 text-[11px] font-bold tracking-wider mb-2">
              AI AGENT / EXECUTION STREAM
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-[#111827] text-[14px] font-semibold">
                Policy simulation - Backend output
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[12px]">Start/Stop</span>
                <button
                  aria-label="Start/Stop"
                  role="switch"
                  aria-checked={running}
                  onClick={toggle}
                  className="w-10 h-6 bg-gray-900 rounded-full flex items-center p-1 cursor-pointer active:scale-[0.98] transition-all duration-200 ease-out"
                >
                  <div
                    className={`w-4 h-4 bg-[#B6F03F] rounded-full transition-transform duration-200 ease-out ${running ? "translate-x-4" : ""}`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-[22px] p-4 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center px-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-[10px] flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-700"
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
                <div>
                  <h3 className="text-[13px] font-semibold text-gray-900">
                    {agent?.name ?? "No agent selected"}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {agent
                      ? `${agent.id.slice(0, 8)}  SIMULATION`
                      : "Select an agent"}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider transition-colors duration-200 ${
                  busy
                    ? "bg-amber-100 text-amber-800"
                    : running
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {running && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                {busy ? "EVALUATING" : running ? "LIVE" : "STOPPED"}
              </span>
            </div>

            {/* Janela Preta do Terminal */}
            <div className="flex-1 bg-[#111827] rounded-xl overflow-hidden flex flex-col shadow-inner">
              <div className="h-10 bg-[#1F2937] flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-400 text-[11px] font-mono">
                  agentsafe / trading-bot.log
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>

              <div className="flex-1 p-5 font-mono text-[13px] overflow-y-auto bg-[#0B0F19] text-gray-300">
                <div className="flex justify-between text-gray-500 mb-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    {running && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B6F03F] animate-pulse" />
                    )}
                    <span>AGENTSAFE RUNTIME v1.0 {running ? "[LIVE]" : "[OFFLINE]"}</span>
                  </span>
                  <span>solana:devnet</span>
                </div>
                <div className="border-b border-gray-800 mb-4"></div>

                <div className="flex flex-col gap-2">
                  {logs.length === 0 && (
                    <div className="text-gray-600 italic">
                      Start the simulator and trigger an agent behavior. Historical
                      records are preserved in the backend.
                    </div>
                  )}
                  {logs.map((log, i) => {
                    const isApproved =
                      log.type === "approved" ||
                      log.type === "success" ||
                      log.text.includes("APPROVED") ||
                      log.text.includes("[SUCCESS]") ||
                      log.text.includes("[SUCESSO]");
                    const isBlocked =
                      log.type === "blocked" ||
                      log.type === "error" ||
                      log.text.includes("BLOCKED") ||
                      log.text.includes("REJECTED") ||
                      log.text.includes("[BLOCKED") ||
                      log.text.includes("[BLOQUEADO");

                    let logStyle = "text-gray-300";
                    if (isApproved) {
                      logStyle =
                        "bg-emerald-950/40 border border-emerald-500/30 shadow-[0_0_12px_rgba(182,240,63,0.15)] text-[#B6F03F] p-2 rounded -mx-2";
                    } else if (isBlocked) {
                      logStyle =
                        "bg-red-950/40 border border-red-500/30 shadow-[0_0_12px_rgba(240,68,72,0.15)] text-red-300 font-semibold p-2 rounded -mx-2";
                    } else if (log.type === "action") {
                      logStyle = "text-blue-400";
                    } else if (log.type === "system") {
                      logStyle = "text-gray-400";
                    }

                    return (
                      <div
                        key={i}
                        className={`flex gap-3 animate-in fade-in duration-150 ${logStyle}`}
                      >
                        <span className="text-gray-600 shrink-0 font-mono">
                          {log.time}
                        </span>
                        <span className="flex-1 font-mono break-all">
                          {log.text}
                        </span>
                      </div>
                    );
                  })}
                  {history
                    .filter((h) => h.agent_id === agentId)
                    .slice(0, 10)
                    .map((h) => {
                      const isApproved = h.decision === "APPROVED";
                      return (
                        <div
                          key={h.id}
                          className={`text-[11px] flex items-center justify-between py-1 px-2 rounded font-mono transition-colors ${
                            isApproved
                              ? "bg-emerald-950/20 text-emerald-300/90 border border-emerald-500/20"
                              : "bg-red-950/20 text-red-300/90 border border-red-500/20"
                          }`}
                        >
                          <span className="text-gray-500 text-[10px]">
                            {new Date(h.created_at).toLocaleTimeString()}
                          </span>
                          <span className="font-medium text-gray-200">
                            {fromLamports(h.amount_lamports)} SOL
                          </span>
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                              isApproved
                                ? "bg-emerald-900/60 text-[#B6F03F] border border-emerald-500/30"
                                : "bg-red-900/60 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {h.decision}
                          </span>
                          <span
                            className="text-gray-400 truncate max-w-[140px] text-[10px]"
                            title={h.reason}
                          >
                            {h.reason}
                          </span>
                        </div>
                      );
                    })}
                  {/* Cursor piscante falso */}
                  {logs.length > 0 && (
                    <div className="flex gap-3 mt-1">
                      <span className="text-gray-600"></span>
                      <span className="w-2 h-4 bg-gray-500 animate-pulse"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
