export interface WalletKey {
  toString(): string;
}
export interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: WalletKey | null;
  connect(options?: {
    onlyIfTrusted: boolean;
  }): Promise<{ publicKey: WalletKey }>;
  disconnect(): Promise<void>;
  signMessage?(
    message: Uint8Array,
    display?: "utf8",
  ): Promise<{ signature: Uint8Array; publicKey?: WalletKey }>;
  on?(event: string, handler: (key?: WalletKey | null) => void): void;
  removeListener?(
    event: string,
    handler: (key?: WalletKey | null) => void,
  ): void;
}
declare global {
  interface Window {
    phantom?: { solana?: PhantomProvider };
    solana?: PhantomProvider;
  }
}
export function getProvider(): PhantomProvider | undefined {
  const provider = window.phantom?.solana ?? window.solana;
  return provider?.isPhantom ? provider : undefined;
}
export async function connectWallet(
  provider?: PhantomProvider,
): Promise<string> {
  if (!provider?.isPhantom) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
    if (isMobile && typeof window !== 'undefined') {
      window.location.href = 'https://phantom.app/ul/browse/' + encodeURIComponent(window.location.href) + '?ref=' + encodeURIComponent(window.location.origin);
    }
    throw new Error(
      "Install the Phantom extension in this browser to connect your wallet.",
    );
  }
  const result = await provider.connect();
  return result.publicKey.toString();
}
export async function disconnectWallet(
  provider?: PhantomProvider,
): Promise<void> {
  if (provider) await provider.disconnect();
}

export async function signWalletMessage(
  provider: PhantomProvider,
  message: string,
  expectedAddress: string,
): Promise<string> {
  if (!provider.signMessage)
    throw new Error(
      "This wallet does not support message signing. Please use the Phantom extension.",
    );
  const signed = await provider.signMessage(
    new TextEncoder().encode(message),
    "utf8",
  );
  if (signed.publicKey && signed.publicKey.toString() !== expectedAddress)
    throw new Error("Wallet changed during signing. Please try again.");
  if (
    !(signed.signature instanceof Uint8Array) ||
    signed.signature.length !== 64
  )
    throw new Error("Wallet returned an invalid signature.");
  return btoa(String.fromCharCode(...signed.signature));
}
