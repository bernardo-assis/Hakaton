import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { config } from '../config/unifiedConfig';

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
  }

  /**
   * Generates a new random Keypair.
   */
  generateKeypair(): Keypair {
    return Keypair.generate();
  }

  /**
   * Requests an airdrop on the Devnet for testing.
   */
  async requestAirdrop(publicKeyBase58: string, amountSol: number = 1): Promise<string> {
    const pubKey = new PublicKey(publicKeyBase58);
    const signature = await this.connection.requestAirdrop(
      pubKey,
      amountSol * LAMPORTS_PER_SOL
    );
    
    // Confirm the airdrop transaction
    const latestBlockHash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    
    return signature;
  }

  /**
   * Sends Lamports from one account to another and signs the transaction.
   */
  async sendLamports(
    senderSecretKey: Uint8Array,
    recipientPublicKeyBase58: string,
    amountLamports: number
  ): Promise<string> {
    const senderKeypair = Keypair.fromSecretKey(senderSecretKey);
    const recipientPubKey = new PublicKey(recipientPublicKeyBase58);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: recipientPubKey,
        lamports: amountLamports,
      })
    );

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [senderKeypair]
    );

    return signature;
  }
}
