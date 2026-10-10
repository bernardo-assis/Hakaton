import { useState, useEffect } from "react";
import {
  request,
  sol,
  fromLamports,
  toLamports,
  usagePercent,
} from "../lib/api";
import type { Agent, Vault, Policies } from "../lib/api";
import { useWalletAuth } from "../components/WalletAuth";

export function VaultBudgets() {
  const auth = useWalletAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [modal, setModal] = useState<"create" | "policy" | "agent" | null>(
    null,
  );
  const owner = auth.session?.owner_pubkey ?? "";
  const [editing, setEditing] = useState<Agent | null>(null);
  const [daily, setDaily] = useState("");
  const [single, setSingle] = useState("");
  const [low, setLow] = useState("0");
  const [approval, setApproval] = useState("0");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, a] = await Promise.all([
        request<Vault[]>("/vaults"),
        request<Agent[]>("/agents"),
      ]);
      setVaults(v);
      setAgents(a);
      setSelected((id) =>
        v.some((vault) => vault.id === id) ? id : (v[0]?.id ?? ""),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar cofres.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const vault = vaults.find((v) => v.id === selected);
  const fleet = agents.filter((a) => a.vault_id === selected);
  const totalCap = fleet.reduce(
    (n, a) => n + fromLamports(a.daily_cap_lamports),
    0,
  );
  const spent = fleet.reduce(
    (n, a) => n + fromLamports(a.spent_today_lamports),
    0,
  );
  const policies: Policies = vault?.policies ?? {
    pause_on_low_balance: false,
    low_balance_threshold_lamports: "0",
    require_human_approval: false,
    approval_threshold_lamports: "0",
    block_unlisted_recipients: false,
  };
  const togglePolicy = async (
    field:
      | "pause_on_low_balance"
      | "require_human_approval"
      | "block_unlisted_recipients",
  ) => {
    if (!vault) return;
    setBusy(true);
    setError("");
    try {
      await request(`/vaults/${vault.id}/policies`, {
        method: "PATCH",
        body: JSON.stringify({ ...policies, [field]: !policies[field] }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar poltica.");
    } finally {
      setBusy(false);
    }
  };
  const openPolicy = () => {
    setLow(String(fromLamports(policies.low_balance_threshold_lamports)));
    setApproval(String(fromLamports(policies.approval_threshold_lamports)));
    setError("");
    setModal(vault ? "policy" : "create");
  };
  const adjust = (a: Agent) => {
    setEditing(a);
    setDaily(String(fromLamports(a.daily_cap_lamports)));
    setSingle(String(fromLamports(a.single_tx_cap_lamports)));
    setError("");
    setModal("agent");
  };
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      if (modal === "create") {
        const created = await request<Vault>("/vaults/local", {
          method: "POST",
          body: JSON.stringify({ owner_pubkey: owner.trim() }),
        });
        setSelected(created.id);
      } else if (modal === "policy" && vault) {
        await request(`/vaults/${vault.id}/policies`, {
          method: "PATCH",
          body: JSON.stringify({
            ...policies,
            low_balance_threshold_lamports: toLamports(low),
            approval_threshold_lamports: toLamports(approval),
          }),
        });
      } else if (modal === "agent" && editing) {
        const d = toLamports(daily),
          t = toLamports(single);
        if (BigInt(t) > BigInt(d))
          throw new Error("Limite por transao excede limite dirio.");
        await request(`/agents/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            daily_cap_lamports: d,
            single_tx_cap_lamports: t,
          }),
        });
      }
      setModal(null);
      setMessage("Configuration salva no backend.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  };
  const recommend = async () => {
    if (!vault) {
      setError("Cadastre e selecione um cofre primeiro.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request<{
        recommendation: string;
        transferred: false;
      }>(`/vaults/${vault.id}/optimize`, { method: "POST", body: "{}" });
      setMessage(
        `Recomenda��o por regras: ${result.recommendation} Nenhuma transfer�ncia realizada.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na recomendao.");
    } finally {
      setBusy(false);
    }
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ vault, agents: fleet }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agentsafe-vault-budget.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 mt-8 pb-12">
      {loading && (
        <p role="status" className="text-[#777D85] text-[13px] mb-4">
          Carregando cofres...
        </p>
      )}
      {error && (
        <p role="alert" className="text-[#F04448] text-[13px] mb-4">
          {error} {vault && <span>Dados da ltima atualizao.</span>}{" "}
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
      {/* Cabealho */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[#111827] text-[30px] font-medium font-inter">
            Vault Budgets
          </h1>
          <span className="text-[#777D85] text-[13px] font-normal">
            Allocate capital, manage liquidity, and set global spending rules
            for the fleet.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={busy}
            onClick={openPolicy}
            className="bg-white border border-[#E8EAEC] text-[#111827] px-4 py-2.5 rounded-full text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {vault ? "Configurar pol�tica" : "Cadastrar carteira"}
          </button>
          <button
            disabled={busy}
            onClick={() => void recommend()}
            className="bg-[#064E3B] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-[#054030] transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Recomenda��o de liquidez
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <select
          aria-label="Cofre selecionado"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="bg-white border border-[#E8EAEC] rounded-[10px] px-4 py-2 text-[13px]"
        >
          <option value="">Selecione um cofre</option>
          {vaults.map((v) => (
            <option value={v.id} key={v.id}>
              {v.vault_pubkey.slice(0, 8)}  {v.status}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setError("");
            setModal("create");
          }}
          className="bg-white border border-[#E8EAEC] text-[#111827] px-4 py-2 rounded-full text-[13px] font-semibold"
        >
          Nova carteira
        </button>
        <button
          disabled={!vault}
          onClick={exportData}
          className="bg-white border border-[#E8EAEC] text-[#111827] px-4 py-2 rounded-full text-[13px] font-semibold"
        >
          Exportar
        </button>
      </div>
      {!vault && !loading && !error && (
        <p className="text-[#777D85] text-[13px] mb-4">
          Cadastre sua carteira autenticada para acompanhar o saldo Devnet. Sua
          chave privada permanece na Phantom.
        </p>
      )}
      {/* Grid de Mtricas do Cofre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Saldo Total */}
        <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#777D85] text-[13px] font-medium">
              Liquidez Dispon�vel
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E6F8F0] flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#24865E]"
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
            <h2 className="text-[#111827] text-[32px] font-semibold tracking-tight">
              {vault?.balance_lamports == null
                ? "Indisponvel"
                : sol(fromLamports(vault.balance_lamports))}
            </h2>
            <p className="text-[#24865E] text-[12px] font-medium mt-1 flex items-center gap-1">
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
              </svg>
              Saldo consultado na Devnet
            </p>
          </div>
        </div>

        {/* Capital Travado */}
        <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#777D85] text-[13px] font-medium">
              Limites dos agentes
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
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
            </div>
          </div>
          <div>
            <h2 className="text-[#111827] text-[32px] font-semibold tracking-tight">
              {vault ? sol(totalCap) : ""}
            </h2>
            <p className="text-[#777D85] text-[12px] font-medium mt-1">
              Soma dos limites; no representa reserva de saldo
            </p>
          </div>
        </div>

        {/* Consumo Hoje */}
        <div className="bg-[#064E3B] rounded-[22px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#A5C0B4] text-[13px] font-medium">
              Gastos confirmados hoje
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#B6F03F]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-white text-[32px] font-semibold tracking-tight">
              {vault ? sol(spent) : ""}
            </h2>
            <div className="w-full bg-[#054030] rounded-full h-[6px] mt-3 overflow-hidden">
              <div
                className="bg-[#B6F03F] h-full rounded-full"
                style={{ width: `${usagePercent(spent, totalCap)}%` }}
              ></div>
            </div>
            <p className="text-[#A5C0B4] text-[11px] font-medium mt-2">
              {usagePercent(spent, totalCap).toFixed(0)}% do limite dirio
              consumido
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda: Alocao por Agente */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 h-full">
            <h3 className="text-[#111827] text-[16px] font-semibold mb-6">
              Distribui��o de Or�amento por Agente
            </h3>

            <div className="flex flex-col gap-6">
              {!loading && !error && !fleet.length && (
                <p className="text-[#777D85] text-[13px]">
                  Nenhum agente neste cofre.
                </p>
              )}
              {fleet.map((agent) => (
                <div key={agent.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center shrink-0">
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
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[#111827] text-[13px] font-medium">
                        {agent.name}
                      </span>
                      <span className="text-[#111827] text-[13px] font-semibold">
                        {sol(fromLamports(agent.spent_today_lamports))}{" "}
                        <span className="text-[#777D85] font-normal">
                          / {sol(fromLamports(agent.daily_cap_lamports))}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-[#F6F7F7] rounded-full h-[6px] overflow-hidden">
                      <div
                        className="bg-[#F04448] h-full rounded-full"
                        style={{
                          width: `${usagePercent(fromLamports(agent.spent_today_lamports), fromLamports(agent.daily_cap_lamports))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <button
                    onClick={() => adjust(agent)}
                    className="text-[12px] font-medium text-[#111827] border border-[#E8EAEC] px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Adjust
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Pol�ticas Globais */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[22px] p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center gap-2 mb-6">
              <svg
                className="w-5 h-5 text-[#24865E]"
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
              <h3 className="text-[#111827] text-[16px] font-semibold">
                Pol�ticas Globais (Cofre)
              </h3>
            </div>

            <div className="flex flex-col gap-5">
              {/* Toggle 1 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">
                    Pause fleet on low balance
                  </h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">
                    Bloqueia a avalia��o se o saldo ficar abaixo de{" "}
                    {sol(fromLamports(policies.low_balance_threshold_lamports))}
                    .
                  </p>
                </div>
                <button
                  aria-label="Pause fleet on low balance"
                  role="switch"
                  aria-checked={policies.pause_on_low_balance}
                  disabled={busy || !vault}
                  onClick={() => void togglePolicy("pause_on_low_balance")}
                  className={`w-10 h-6 ${policies.pause_on_low_balance ? "bg-[#064E3B]" : "bg-gray-200"} rounded-full flex items-center p-1 cursor-pointer shrink-0`}
                >
                  <div
                    className={`w-4 h-4 bg-[#B6F03F] rounded-full ${policies.pause_on_low_balance ? "translate-x-4" : ""} transition-transform`}
                  ></div>
                </button>
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Toggle 2 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">
                    Exigir aprovao humana
                  </h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">
                    Bloqueia solicitaes acima de{" "}
                    {sol(fromLamports(policies.approval_threshold_lamports))};
                    aprovao ainda indisponvel.
                  </p>
                </div>
                <button
                  aria-label="Exigir aprovao humana"
                  role="switch"
                  aria-checked={policies.require_human_approval}
                  disabled={busy || !vault}
                  onClick={() => void togglePolicy("require_human_approval")}
                  className={`w-10 h-6 ${policies.require_human_approval ? "bg-[#064E3B]" : "bg-gray-200"} rounded-full flex items-center p-1 cursor-pointer shrink-0`}
                >
                  <div
                    className={`w-4 h-4 bg-[#B6F03F] rounded-full ${policies.require_human_approval ? "translate-x-4" : ""} transition-transform`}
                  ></div>
                </button>
              </div>

              <div className="h-px w-full bg-gray-100"></div>

              {/* Toggle 3 */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[#111827] text-[13px] font-medium mb-1">
                    Restringir destinatrios
                  </h4>
                  <p className="text-[#777D85] text-[11px] leading-tight">
                    Bloqueia destinatrios fora da lista de cada agente.
                  </p>
                </div>
                <button
                  aria-label="Restringir destinatrios"
                  role="switch"
                  aria-checked={policies.block_unlisted_recipients}
                  disabled={busy || !vault}
                  onClick={() => void togglePolicy("block_unlisted_recipients")}
                  className={`w-10 h-6 ${policies.block_unlisted_recipients ? "bg-[#064E3B]" : "bg-gray-200"} rounded-full flex items-center p-1 cursor-pointer shrink-0`}
                >
                  <div
                    className={`w-4 h-4 bg-[#B6F03F] rounded-full ${policies.block_unlisted_recipients ? "translate-x-4" : ""} transition-transform`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Configuration do cofre"
            className="bg-white w-full max-w-[600px] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
              <h2 className="text-[#111827] text-[20px] font-semibold">
                {modal === "create"
                  ? "Cadastrar carteira Devnet"
                  : modal === "agent"
                    ? "Ajustar limites"
                    : "Configurar pol�tica global"}
              </h2>
              <button
                  aria-label="Fechar"
                  disabled={busy}
                  onClick={() => setModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col gap-4">
              {error && (
                <p role="alert" className="text-[#F04448] text-[13px]">
                  {error}
                </p>
              )}
              {modal === "create" ? (
                <label className="text-[#111827] text-[13px]">
                  Endere�o p�blico da carteira
                  <input
                    value={owner}
                    readOnly
                    placeholder="Endereo Solana pblico"
                    className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2"
                  />
                  <p className="text-[#777D85] text-[12px] mt-3">
                    Esta � a carteira autenticada pela Phantom. O cadastro
                    acompanha seu saldo Devnet e n�o autoriza saques. No
                    informe chave privada.
                  </p>
                </label>
              ) : modal === "agent" ? (
                <>
                  <label className="text-[#111827] text-[13px]">
                    Limite dirio (SOL)
                    <input
                      value={daily}
                      onChange={(e) => setDaily(e.target.value)}
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2"
                    />
                  </label>
                  <label className="text-[#111827] text-[13px]">
                    Limite por transao (SOL)
                    <input
                      value={single}
                      onChange={(e) => setSingle(e.target.value)}
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="text-[#111827] text-[13px]">
                    Saldo mnimo (SOL)
                    <input
                      value={low}
                      onChange={(e) => setLow(e.target.value)}
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2"
                    />
                  </label>
                  <label className="text-[#111827] text-[13px]">
                    Valor para exigir aprovao (SOL)
                    <input
                      value={approval}
                      onChange={(e) => setApproval(e.target.value)}
                      className="w-full bg-[#F6F7F7] border border-[#E8EAEC] rounded-[10px] px-4 py-2.5 mt-2"
                    />
                  </label>
                  <p className="text-[#777D85] text-[12px]">
                    Ative as regras nos controles do painel. Solicitaes acima
                    do limite de aprovao sero bloqueadas nesta verso.
                  </p>
                </>
              )}
            </div>
            <div className="p-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                disabled={busy}
                onClick={() => setModal(null)}
                className="px-6 py-3 rounded-full text-[14px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={busy}
                onClick={() => void save()}
                className="bg-[#B6F03F] text-[#111827] px-8 py-3 rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity"
              >
                {busy ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
