import { toLamports } from './api.ts';
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
export function paymentLabel(p: Pick<Payment, 'decision' | 'approval_status' | 'settlement_status'>): string {
    if (p.approval_status === 'REJECTED')
        return 'Recusado';
    if (p.decision === 'BLOCKED')
        return 'Bloqueado';
    if (p.settlement_status === 'CONFIRMED')
        return 'Confirmado';
    if (p.settlement_status === 'FAILED')
        return 'Falhou';
    if (p.settlement_status === 'UNKNOWN')
        return 'Verificando na rede';
    if (p.settlement_status === 'SUBMITTED')
        return 'Enviado à rede';
    if (p.approval_status === 'PENDING')
        return 'Aguardando aprovação';
    return 'Aguardando envio';
}
export function paymentRequest(agent_id: string, idempotency_key: string, recipient_pubkey: string, value: string, purpose: string) {
    const amount_lamports = toLamports(value);
    if (BigInt(amount_lamports) <= 0n)
        throw new Error('O valor deve ser maior que zero.');
    if (!agent_id || !recipient_pubkey.trim())
        throw new Error('Selecione um agente e informe o destinatário.');
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
