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
  if (!provider?.isPhantom)
    throw new Error(
      "Instale a extensão Phantom neste navegador para conectar a carteira.",
    );
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
      "Esta carteira não oferece assinatura de mensagens. Use a extensão Phantom.",
    );
  const signed = await provider.signMessage(
    new TextEncoder().encode(message),
    "utf8",
  );
  if (signed.publicKey && signed.publicKey.toString() !== expectedAddress)
    throw new Error("A carteira mudou durante a assinatura. Tente novamente.");
  if (
    !(signed.signature instanceof Uint8Array) ||
    signed.signature.length !== 64
  )
    throw new Error("A carteira retornou uma assinatura inválida.");
  return btoa(String.fromCharCode(...signed.signature));
}
