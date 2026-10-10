import { request } from "./api.ts";
import { connectWallet, signWalletMessage } from "./wallet.ts";
import type { PhantomProvider } from "./wallet.ts";
export interface WalletSession {
  authenticated: true;
  owner_pubkey: string;
  expires_at: string;
}
export type SessionResponse = WalletSession | { authenticated: false };
export class IdentityGeneration {
  current = 0;
  advance(): number {
    return ++this.current;
  }
  isCurrent(generation: number): boolean {
    return generation === this.current;
  }
}
export async function authenticateWallet(
  provider?: PhantomProvider,
  client: typeof request = request,
  isCurrent: () => boolean = () => true,
  onConnected: (address: string) => void = () => {},
): Promise<WalletSession> {
  const assertCurrent = (address?: string) => {
    if (
      !isCurrent() ||
      (address && provider?.publicKey?.toString() !== address)
    )
      throw new Error(
        "Operação interrompida: a carteira mudou. Tente novamente.",
      );
  };
  const address = await connectWallet(provider);
  assertCurrent(address);
  onConnected(address);
  const challenge = await client<{
    challenge_id: string;
    message: string;
    expires_at: string;
  }>("/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ owner_pubkey: address }),
  });
  assertCurrent(address);
  if (
    !challenge.message ||
    !Number.isFinite(Date.parse(challenge.expires_at)) ||
    Date.parse(challenge.expires_at) <= Date.now()
  )
    throw new Error("O pedido de assinatura expirou. Tente novamente.");
  const signature = await signWalletMessage(
    provider!,
    challenge.message,
    address,
  );
  assertCurrent(address);
  const verified = await client<SessionResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ challenge_id: challenge.challenge_id, signature }),
  });
  assertCurrent(address);
  if (!verified.authenticated || verified.owner_pubkey !== address)
    throw new Error("Não foi possível verificar esta carteira.");
  const session = await client<SessionResponse>("/auth/session");
  assertCurrent(address);
  if (
    !session.authenticated ||
    session.owner_pubkey !== address ||
    !Number.isFinite(Date.parse(session.expires_at)) ||
    Date.parse(session.expires_at) <= Date.now()
  )
    throw new Error("A sessão não foi confirmada. Tente novamente.");
  return session;
}
