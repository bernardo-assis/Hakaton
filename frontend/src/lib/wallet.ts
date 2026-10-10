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
