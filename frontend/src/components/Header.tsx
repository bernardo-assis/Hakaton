import { useState, useEffect } from "react";
import { request } from "../lib/api";
import type { AuditEvent } from "../lib/api";
import { getProvider, connectWallet, disconnectWallet } from "../lib/wallet";
import type { WalletKey } from "../lib/wallet";

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Header({
  currentPage = "dashboard",
  onNavigate = () => {},
}: HeaderProps) {
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const provider = getProvider();
    const changed = (key?: WalletKey | null) => {
      const address = key?.toString() ?? "";
      setWallet(address);
      window.dispatchEvent(
        new CustomEvent("agentsafe:wallet", { detail: address }),
      );
    };
    const disconnected = () => changed(null);
    if (provider?.publicKey) changed(provider.publicKey);
    provider?.on?.("accountChanged", changed);
    provider?.on?.("connect", changed);
    provider?.on?.("disconnect", disconnected);
    return () => {
      provider?.removeListener?.("accountChanged", changed);
      provider?.removeListener?.("connect", changed);
      provider?.removeListener?.("disconnect", disconnected);
    };
  }, []);
  const toggleWallet = async () => {
    setBusy(true);
    setError("");
    try {
      const provider = getProvider();
      if (wallet) {
        await disconnectWallet(provider);
        setWallet("");
        window.dispatchEvent(
          new CustomEvent("agentsafe:wallet", { detail: "" }),
        );
      } else {
        const address = await connectWallet(provider);
        setWallet(address);
        window.dispatchEvent(
          new CustomEvent("agentsafe:wallet", { detail: address }),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conexão recusada.");
    } finally {
      setBusy(false);
    }
  };
  const toggleNotifications = async () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    setNotificationsOpen(true);
    setLoading(true);
    setError("");
    try {
      setNotifications(await request<AuditEvent[]>("/notifications"));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao carregar notificações.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <header className="max-w-[1280px] mx-auto w-full flex items-center justify-between p-4 h-[76px] mt-2">
      {/* Logo Section */}
      <div
        className="flex items-center gap-[8px] px-2 h-11 cursor-pointer"
        onClick={() => onNavigate("dashboard")}
      >
        <div className="w-8 h-8 bg-[#064E3B] rounded-full flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-white"
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
        <span className="text-[#111827] text-[16px] font-semibold font-inter">
          AgentSafe
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1 bg-white border border-gray-200 rounded-full p-1 h-11 shadow-sm overflow-x-auto hide-scrollbar">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`${currentPage === "dashboard" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap`}
        >
          Overview
        </button>
        <button
          onClick={() => onNavigate("simulator")}
          className={`${currentPage === "simulator" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap`}
        >
          AI Simulator
        </button>
        <button
          onClick={() => onNavigate("fleet")}
          className={`${currentPage === "fleet" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap`}
        >
          Agent Fleet
        </button>
        <button
          onClick={() => onNavigate("vault")}
          className={`${currentPage === "vault" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap`}
        >
          Vault Budgets
        </button>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4 h-11 relative">
        <button
          aria-label="Notificações"
          aria-expanded={notificationsOpen}
          onClick={() => void toggleNotifications()}
          className="text-gray-400 hover:text-[#111827] transition-colors flex items-center justify-center bg-white border border-gray-200 rounded-full w-10 h-10 shadow-sm"
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </button>
        <button
          disabled={busy}
          onClick={() => void toggleWallet()}
          title={
            wallet
              ? `Desconectar ${wallet}`
              : "Conectar carteira (não autentica o usuário)"
          }
          className="flex items-center gap-2 bg-[#B6F03F] text-[#111827] px-5 h-10 rounded-full text-[13px] font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          {busy
            ? "Aguardando Phantom..."
            : wallet
              ? `${wallet.slice(0, 4)}…${wallet.slice(-4)} · Desconectar`
              : "Conectar Phantom Wallet"}
        </button>
        {(notificationsOpen || error) && (
          <div className="absolute top-14 right-0 bg-white rounded-[22px] p-5 shadow-lg border border-gray-100 z-40 w-[340px] max-h-[420px] overflow-y-auto">
            <div className="flex justify-between mb-3">
              <h3 className="text-[#111827] text-[14px] font-semibold">
                {notificationsOpen ? "Notificações" : "Carteira"}
              </h3>
              <button
                aria-label="Fechar painel"
                onClick={() => {
                  setNotificationsOpen(false);
                  setError("");
                }}
                className="text-[#777D85]"
              >
                ×
              </button>
            </div>
            {error && (
              <p role="alert" className="text-[#F04448] text-[12px]">
                {error}{" "}
                {!getProvider() && (
                  <a
                    className="underline"
                    href="https://phantom.com/download"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Baixar Phantom
                  </a>
                )}
              </p>
            )}
            {loading && (
              <p role="status" className="text-[#777D85] text-[12px]">
                Carregando...
              </p>
            )}
            {notificationsOpen &&
              !loading &&
              !error &&
              notifications.length === 0 && (
                <p className="text-[#777D85] text-[12px]">
                  Nenhuma notificação registrada.
                </p>
              )}
            {notificationsOpen &&
              notifications.map((event) => (
                <div key={event.id} className="py-3 border-b border-gray-100">
                  <p className="text-[#111827] text-[12px] font-medium">
                    {event.action}
                  </p>
                  <p className="text-[#777D85] text-[11px]">
                    {event.reason ?? event.target_id}
                  </p>
                  <time className="text-[#777D85] text-[10px]">
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </div>
              ))}
          </div>
        )}
      </div>
    </header>
  );
}
