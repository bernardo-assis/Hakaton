import { config } from '../config/unifiedConfig';
import { paymentError } from '../repositories/PaymentRepository';
export function base58(bytes: Uint8Array) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let n = BigInt('0x' + Buffer.from(bytes).toString('hex')), s = '';
    while (n) {
        s = alphabet[Number(n % 58n)] + s;
        n /= 58n;
    }
    for (const b of bytes) {
        if (b)
            break;
        s = '1' + s;
    }
    return s;
}
export interface PreparedPayment {
    fee: bigint;
    bytes: string;
    signature: string;
    blockhash: string;
    lastValidBlockHeight: number;
}
export interface PaymentNetwork {
    guard(): Promise<void>;
    balance(pubkey: string): Promise<bigint>;
    prepare(secret: Buffer, recipient: string, amount: bigint): Promise<PreparedPayment>;
    send(bytes: string, signature: string): Promise<void>;
    status(signature: string, expectedBytes?: string): Promise<{
        state: 'CONFIRMED' | 'FAILED' | 'UNKNOWN';
        fee?: bigint;
    }>;
    canResend?(lastValidBlockHeight: number): Promise<boolean>;
}
export class DevnetPaymentNetwork implements PaymentNetwork {
    private connection: any;
    private finalizedSlot = 0;
    private sdk() {
        return require('@solana/web3.js') as typeof import('@solana/web3.js');
    }
    private rpc() {
        if (!this.connection) {
            const { Connection } = this.sdk();
            this.connection = new Connection(config.solana.rpcUrl, { commitment: 'finalized', disableRetryOnRateLimit: true, fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(8000) }) });
        }
        return this.connection;
    }
    async guard() {
        if (!config.payments.enabled)
            throw paymentError('Devnet payments disabled', 501);
        if (await this.rpc().getGenesisHash() !== 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG')
            throw paymentError('Only Solana Devnet is allowed', 409);
    }
    async balance(pubkey: string) {
        const response = await this.rpc().getBalanceAndContext(new (this.sdk().PublicKey)(pubkey), { commitment: 'finalized', minContextSlot: this.finalizedSlot });
        const n = response.value;
        if (!Number.isSafeInteger(n))
            throw paymentError('Balance outside safe RPC range');
        return BigInt(n);
    }
    async prepare(secret: Buffer, recipient: string, amount: bigint) {
        const { Keypair, PublicKey, Transaction, SystemProgram } = this.sdk();
        const signer = Keypair.fromSecretKey(secret);
        const latest = await this.rpc().getLatestBlockhash('finalized');
        const tx = new Transaction({ feePayer: signer.publicKey, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight }).add(SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: new PublicKey(recipient), lamports: amount }));
        const feeResult = await this.rpc().getFeeForMessage(tx.compileMessage(), 'finalized');
        if (feeResult.value === null || !Number.isSafeInteger(feeResult.value))
            throw paymentError('Fee unavailable');
        tx.sign(signer);
        return { fee: BigInt(feeResult.value), bytes: tx.serialize().toString('base64'), signature: base58(tx.signature!), blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight };
    }
    async send(bytes: string, signature: string) {
        const returned = await this.rpc().sendRawTransaction(Buffer.from(bytes, 'base64'), { skipPreflight: false, preflightCommitment: 'finalized', maxRetries: 2 });
        if (returned !== signature)
            throw paymentError('RPC signature mismatch');
    }
    async canResend(lastValidBlockHeight: number) {
        return (await this.rpc().getBlockHeight('finalized')) <= lastValidBlockHeight;
    }
    async status(signature: string, expectedBytes?: string) {
        const response = await this.rpc().getSignatureStatuses([signature], { searchTransactionHistory: true }), status = response.value[0];
        if (!status || status.confirmationStatus !== 'finalized')
            return { state: 'UNKNOWN' as const };
        const tx = await this.rpc().getTransaction(signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 });
        if (!tx?.meta || !Number.isSafeInteger(tx.meta.fee))
            return { state: 'UNKNOWN' as const };
        if (!expectedBytes)
            throw paymentError('Expected signed transaction required');
        const expected = this.sdk().Transaction.from(Buffer.from(expectedBytes, 'base64'));
        if (!expected.verifySignatures() || base58(expected.signature!) !== signature || tx.transaction.signatures[0] !== signature || !Buffer.from(tx.transaction.message.serialize()).equals(expected.serializeMessage()) || !!status.err !== !!tx.meta.err)
            throw paymentError('Confirmed transaction mismatch');
        this.finalizedSlot = Math.max(this.finalizedSlot, status.slot);
        return { state: tx.meta.err ? 'FAILED' as const : 'CONFIRMED' as const, fee: BigInt(tx.meta.fee) };
    }
}
