import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { request, setIdentityGeneration } from "../lib/api";
import { authenticateWallet, IdentityGeneration } from "../lib/authFlow";
import type { SessionResponse, WalletSession } from "../lib/authFlow";
import { getProvider, disconnectWallet } from "../lib/wallet";
import type { WalletKey } from "../lib/wallet";

type AuthStatus =
  | "checking"
  | "anonymous"
  | "signing"
  | "authenticated"
  | "revoking";
interface WalletAuthState {
  session: WalletSession | null;
  connectedWallet: string;
  status: AuthStatus;
  error: string;
  generation: number;
  revocationPending: boolean;
  login(): Promise<void>;
  logout(): Promise<void>;
  clearError(): void;
}
const WalletAuthContext = createContext<WalletAuthState | null>(null);
export function useWalletAuth(): WalletAuthState {
  const auth = useContext(WalletAuthContext);
  if (!auth) throw new Error("WalletAuthProvider ausente.");
  return auth;
}
export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connectedWallet, setConnectedWallet] = useState("");
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const [revocationPending, setRevocationPending] = useState(false);
  const identity = useRef(new IdentityGeneration());
  const sessionRef = useRef<WalletSession | null>(null);
  const expectedWallet = useRef<string | null>(null);
  const operation = useRef(false);
  const revoking = useRef(false);
  const revocationNeeded = useRef(false);
  const alive = useRef(true);
  const clearIdentity = () => {
    const next = identity.current.advance();
    setIdentityGeneration(next);
    sessionRef.current = null;
    expectedWallet.current = null;
    if (alive.current) {
      setSession(null);
      setGeneration(next);
    }
    for (const key of [
      "agentsafe.simulator.running",
      "agentsafe.simulator.agent",
      "agentsafe.simulator.recipient",
    ])
      localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("agentsafe:wallet", { detail: "" }));
    return next;
  };
  const publish = (value: WalletSession) => {
    sessionRef.current = value;
    setSession(value);
    setStatus("authenticated");
    setError("");
    window.dispatchEvent(
      new CustomEvent("agentsafe:wallet", { detail: value.owner_pubkey }),
    );
  };
  const revoke = async (): Promise<boolean> => {
    revocationNeeded.current = true;
    if (alive.current) setRevocationPending(true);
    try {
      await request<SessionResponse>("/auth/logout", {
        method: "POST",
        body: "{}",
      });
      revocationNeeded.current = false;
      if (alive.current) setRevocationPending(false);
      return true;
    } catch {
      if (alive.current)
        setError(
          "Data hidden, but could not end the session on the server. Try logging out again before entering.",
        );
      return false;
    }
  };
  const logout = async () => {
    if (revoking.current) return;
    revoking.current = true;
    clearIdentity();
    setStatus("revoking");
    setError("");
    const revoked = await revoke();
    try {
      await disconnectWallet(getProvider());
      setConnectedWallet("");
    } catch {
      if (revoked)
        setError(
          "Session ended. The wallet is still connected to the extension.",
        );
    } finally {
      revoking.current = false;
      if (alive.current) setStatus("anonymous");
    }
  };
  const login = async () => {
    if (operation.current || revoking.current) return;
    operation.current = true;
    const current = clearIdentity();
    setStatus("signing");
    setError("");
    try {
      if (!(await revoke())) return;
      if (!identity.current.isCurrent(current)) return;
      const value = await authenticateWallet(
        getProvider(),
        request,
        () => alive.current && identity.current.isCurrent(current),
        (address) => {
          expectedWallet.current = address;
          setConnectedWallet(address);
        },
      );
      if (!identity.current.isCurrent(current)) {
        await revoke();
        return;
      }
      publish(value);
    } catch (e) {
      if (identity.current.isCurrent(current) && alive.current) {
        setError(
          e instanceof Error
            ? e.message
            : "Signature not authorized. Try again.",
        );
        // A verify response can be lost after the server created its cookie.
      }
      await revoke();
    } finally {
      operation.current = false;
      expectedWallet.current = null;
      if (alive.current && !sessionRef.current) setStatus("anonymous");
    }
  };
  useEffect(() => {
    alive.current = true;
    const provider = getProvider();
    const initial = provider?.publicKey?.toString() ?? "";
    setConnectedWallet(initial);
    const changed = (key?: WalletKey | null) => {
      const address = key?.toString() ?? "";
      setConnectedWallet(address);
      const expected =
        expectedWallet.current ?? sessionRef.current?.owner_pubkey;
      if (expected && expected !== address) {
        clearIdentity();
        setStatus("revoking");
        void revoke().finally(() => {
          if (alive.current) setStatus("anonymous");
        });
      }
    };
    const disconnected = () => {
      setConnectedWallet("");
      if (revoking.current) return;
      clearIdentity();
      setStatus("revoking");
      void revoke().finally(() => {
        if (alive.current) setStatus("anonymous");
      });
    };
    const unauthorized = (event: Event) => {
      const requestGeneration = (event as CustomEvent<{ generation: number }>)
        .detail.generation;
      if (!identity.current.isCurrent(requestGeneration)) return;
      clearIdentity();
      setStatus("anonymous");
      setError("Your session expired. Log in again with Phantom.");
    };
    provider?.on?.("connect", changed);
    provider?.on?.("accountChanged", changed);
    provider?.on?.("disconnect", disconnected);
    window.addEventListener("agentsafe:unauthorized", unauthorized);
    const current = identity.current.advance();
    setIdentityGeneration(current);
    setGeneration(current);
    const restore = async () => {
      try {
        const value = await request<SessionResponse>("/auth/session");
        if (!alive.current || !identity.current.isCurrent(current)) return;
        if (!value.authenticated) {
          clearIdentity();
          setStatus("anonymous");
          return;
        }
        if (
          !Number.isFinite(Date.parse(value.expires_at)) ||
          Date.parse(value.expires_at) <= Date.now()
        ) {
          clearIdentity();
          setStatus("anonymous");
          return;
        }
        if (!provider) {
          clearIdentity();
          setStatus("anonymous");
          setError("Connect Phantom to recover your session.");
          return;
        }
        const trusted =
          provider.publicKey ??
          (await provider.connect({ onlyIfTrusted: true })).publicKey;
        if (!alive.current || !identity.current.isCurrent(current)) return;
        const address = trusted.toString();
        setConnectedWallet(address);
        if (address !== value.owner_pubkey) {
          clearIdentity();
          setStatus("revoking");
          await revoke();
          if (alive.current) setStatus("anonymous");
          return;
        }
        publish(value);
      } catch {
        if (alive.current && identity.current.isCurrent(current)) {
          clearIdentity();
          setStatus("anonymous");
          setError(
            "Could not recover session. Connect Phantom to enter.",
          );
        }
      }
    };
    void restore();
    return () => {
      alive.current = false;
      identity.current.advance();
      provider?.removeListener?.("connect", changed);
      provider?.removeListener?.("accountChanged", changed);
      provider?.removeListener?.("disconnect", disconnected);
      window.removeEventListener("agentsafe:unauthorized", unauthorized);
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => {
        clearIdentity();
        setStatus("anonymous");
        setError("Your session expired. Log in again with Phantom.");
      },
      Math.max(0, Date.parse(session.expires_at) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [session]);
  return (
    <WalletAuthContext.Provider
      value={{
        session,
        connectedWallet,
        status,
        error,
        generation,
        revocationPending,
        login,
        logout,
        clearError: () => setError(""),
      }}
    >
      {children}
    </WalletAuthContext.Provider>
  );
}
