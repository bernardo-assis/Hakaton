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
        "Operation aborted: wallet changed. Please try again.",
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
    throw new Error("Signature request expired. Please try again.");
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
    throw new Error("Could not verify wallet signature.");
  const session = await client<SessionResponse>("/auth/session");
  assertCurrent(address);
  if (
    !session.authenticated ||
    session.owner_pubkey !== address ||
    !Number.isFinite(Date.parse(session.expires_at)) ||
    Date.parse(session.expires_at) <= Date.now()
  )
    throw new Error("Session was not confirmed. Please try again.");
  return session;
}
