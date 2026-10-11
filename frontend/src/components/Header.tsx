import { useState } from "react";
import { request } from "../lib/api";
import type { AuditEvent } from "../lib/api";
import { getProvider } from "../lib/wallet";
import { useWalletAuth } from "./WalletAuth";

interface HeaderProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

export function Header({
  currentPage = "dashboard",
  onNavigate = () => {},
}: HeaderProps) {
  const auth = useWalletAuth();
  const wallet = auth.session?.owner_pubkey ?? "";
  const busy =
    auth.status === "checking" ||
    auth.status === "signing" ||
    auth.status === "revoking";
  const [error, setError] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const toggleWallet = () => {
    setError("");
    if (auth.session || auth.revocationPending) void auth.logout();
    else void auth.login();
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
        e instanceof Error ? e.message : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <header className="max-w-[1280px] mx-auto w-full flex items-center justify-between p-4 h-[76px] mt-2">
      {/* Logo Section */}
      <div
        className="flex items-center gap-[8px] px-2 h-11 cursor-pointer hover:opacity-90 transition-opacity"
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
          onClick={() => onNavigate("landing")}
          className="text-[#6B7280] hover:text-[#111827] hover:bg-gray-50 px-3.5 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
        >
          Landing
        </button>
        <button
          onClick={() => onNavigate("dashboard")}
          className={`${currentPage === "dashboard" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap`}
        >
          Overview
        </button>
        <button
          onClick={() => onNavigate("simulator")}
          className={`${currentPage === "simulator" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap`}
        >
          AI Simulator
        </button>
        <button
          onClick={() => onNavigate("fleet")}
          className={`${currentPage === "fleet" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap`}
        >
          Agent Fleet
        </button>
        <button
          onClick={() => onNavigate("vault")}
          className={`${currentPage === "vault" ? "bg-[#F3F4F6] text-[#111827]" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap`}
        >
          Vault Budgets
        </button>
        <button
          onClick={() => onNavigate("docs")}
          className={`${currentPage === "docs" ? "bg-[#064E3B] text-white" : "text-[#6B7280] hover:text-[#111827] hover:bg-gray-50"} px-4 py-1.5 rounded-full text-[13px] font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B6F03F]" />
          Docs
        </button>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4 h-11 relative">
        <button
          disabled={!auth.session || busy}
          aria-label="Notifications"
          aria-expanded={notificationsOpen}
          onClick={() => void toggleNotifications()}
          className="text-gray-400 hover:text-[#111827] active:scale-95 transition-all duration-200 ease-out flex items-center justify-center bg-white border border-gray-200 rounded-full w-10 h-10 shadow-sm disabled:opacity-50 disabled:transform-none cursor-pointer"
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
          onClick={toggleWallet}
          title={
            wallet
              ? `Authenticated wallet: ${wallet}. Disconnect session`
              : auth.connectedWallet
                ? "Wallet connected; sign message to authenticate"
                : "Connect and authenticate with Phantom"
          }
          className="flex items-center gap-2 bg-[#B6F03F] text-[#111827] px-5 h-10 rounded-full text-[13px] font-semibold hover:opacity-90 hover:shadow-sm active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer disabled:opacity-50 disabled:transform-none"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          {wallet && (
            <span
              className="w-2 h-2 rounded-full bg-[#064E3B] animate-pulse flex-shrink-0"
              title="Connected to Solana Devnet"
            />
          )}
          {auth.status === "checking"
            ? "Verifying session..."
            : auth.status === "revoking"
              ? "Disconnecting session..."
              : auth.status === "signing"
                ? "Awaiting signature..."
                : auth.revocationPending
                  ? "Try disconnecting again"
                  : wallet
                    ? `${wallet.slice(0, 4)}…${wallet.slice(-4)} · Disconnect`
                    : auth.connectedWallet
                      ? "Authenticate Phantom Wallet"
                      : "Connect Phantom Wallet"}
        </button>
        {(notificationsOpen || error || auth.error) && (
          <div className="absolute top-14 right-0 bg-white rounded-[22px] p-5 shadow-lg border border-gray-100 z-40 w-[340px] max-h-[420px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between mb-3">
              <h3 className="text-[#111827] text-[14px] font-semibold">
                {notificationsOpen ? "Notifications" : "Wallet"}
              </h3>
              <button
                aria-label="Close panel"
                onClick={() => {
                  setNotificationsOpen(false);
                  setError("");
                  auth.clearError();
                }}
                className="text-[#777D85]"
              >
                ×
              </button>
            </div>
            {(error || auth.error) && (
              <p role="alert" className="text-[#F04448] text-[12px]">
                {error || auth.error}{" "}
                {!getProvider() && (
                  <a
                    className="underline"
                    href="https://phantom.com/download"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download Phantom
                  </a>
                )}
              </p>
            )}
            {!auth.session && auth.connectedWallet && (
              <p className="text-[#777D85] text-[12px] mt-2">
                Wallet connected, but not authenticated yet. The signature
                verifies your identity without moving funds.
              </p>
            )}
            {loading && (
              <p role="status" className="text-[#777D85] text-[12px]">
                Loading...
              </p>
            )}
            {notificationsOpen &&
              !loading &&
              !error &&
              notifications.length === 0 && (
                <p className="text-[#777D85] text-[12px]">
                  No notifications recorded.
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
