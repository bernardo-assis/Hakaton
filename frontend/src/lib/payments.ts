import { request, toLamports } from './api.ts';
export interface Payment {
    id: string;
    agent_id: string;
    vault_id: string;
    recipient_pubkey: string;
    amount_lamports: string;
    network_fee_lamports: string;
    approval_status: string;
    settlement_status: string;
    decision: string;
    purpose?: string;
    solana_signature?: string;
    error_code?: string;
    created_at?: string;
}
export interface PaymentConfig {
    vault_id: string;
    execution_mode: 'AUTOMATIC' | 'MANUAL';
    mode_version: string;
    daily_cap_lamports: string;
    signer_ready: boolean;
    payments_enabled?: boolean;
    balance_lamports: string | null;
    reserved_lamports: string;
    available_lamports: string | null;
    spent_24h_lamports: string;
}
export function paymentLabel(p: Pick<Payment, 'decision' | 'approval_status' | 'settlement_status' | 'error_code'>): string {
    if (p.approval_status === 'REJECTED')
        return 'Rejected';
    if (p.decision === 'BLOCKED') {
        if (p.error_code === 'SINGLE_TX_CAP_EXCEEDED')
            return 'Blocked (Single-tx limit exceeded)';
        if (p.error_code === 'DAILY_CAP_EXCEEDED')
            return 'Blocked (Daily limit exceeded)';
        if (p.error_code === 'VAULT_DAILY_CAP_EXCEEDED')
            return 'Blocked (Vault daily limit exceeded)';
        if (p.error_code === 'RECIPIENT_NOT_ALLOWED')
            return 'Blocked (Recipient not whitelisted)';
        if (p.error_code === 'INSUFFICIENT_BALANCE')
            return 'Blocked (Insufficient balance)';
        if (p.error_code === 'LOW_BALANCE')
            return 'Blocked (Low balance threshold)';
        if (p.error_code)
            return `Blocked (${p.error_code})`;
        return 'Blocked';
    }
    if (p.settlement_status === 'CONFIRMED')
        return 'Confirmed';
    if (p.settlement_status === 'FAILED')
        return 'Failed';
    if (p.settlement_status === 'UNKNOWN')
        return 'Checking the network';
    if (p.settlement_status === 'SUBMITTED')
        return 'Sent to the network';
    if (p.approval_status === 'PENDING')
        return 'Awaiting approval';
    return 'Awaiting submission';
}
export function paymentRequest(agent_id: string, idempotency_key: string, recipient_pubkey: string, value: string, purpose: string) {
    const amount_lamports = toLamports(value);
    if (BigInt(amount_lamports) <= 0n)
        throw new Error('The amount must be greater than zero.');
    if (!agent_id || !recipient_pubkey.trim())
        throw new Error('Select an agent and enter the recipient.');
    return { agent_id, idempotency_key, recipient_pubkey: recipient_pubkey.trim(), amount_lamports, purpose: purpose.trim() };
}
export function explorerLink(signature: string): string | null { return /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature) ? `https://explorer.solana.com/tx/${signature}?cluster=devnet` : null; }
export function paymentIntent(storage: Pick<Storage, 'getItem' | 'setItem'>, scope: string, fingerprint: string, newId: () => string): string {
    const name = `agentsafe.payment.intent.${scope}`;
    const saved = storage.getItem(name);
    if (saved) {
        try {
            const value = JSON.parse(saved);
            if (value.fingerprint === fingerprint && typeof value.key === 'string')
                return value.key;
        }
        catch { /* Corrupt entry is replaced before any request. */ }
    }
    const key = newId();
    storage.setItem(name, JSON.stringify({ key, fingerprint }));
    return key;
}
export async function submitOwnerPayment(
    storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
    scope: string,
    draft: ReturnType<typeof paymentRequest>,
    send: typeof request = request,
): Promise<Payment> {
    const fingerprint = JSON.stringify([draft.agent_id, draft.recipient_pubkey, draft.amount_lamports, draft.purpose]);
    const key = paymentIntent(storage, scope, fingerprint, () => crypto.randomUUID());
    const payment = await send<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify({ ...draft, idempotency_key: key }),
    });
    storage.removeItem(`agentsafe.payment.intent.${scope}`);
    return payment;
}
