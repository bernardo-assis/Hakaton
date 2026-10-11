import { createCipheriv, createDecipheriv, createHash, generateKeyPairSync, randomBytes } from 'crypto';
import { PoolClient } from 'pg';
import { z } from 'zod';
import { config } from '../config/unifiedConfig';
import { Owner, PaymentRepository, paymentError, publicPayment } from '../repositories/PaymentRepository';
import { base58, DevnetPaymentNetwork, PaymentNetwork } from './paymentNetwork';
const pubkey = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/).refine(value => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let decoded = 0n;
    for (const character of value) {
        const digit = alphabet.indexOf(character);
        if (digit < 0)
            return false;
        decoded = decoded * 58n + BigInt(digit);
    }
    const leading = value.match(/^1*/)?.[0].length ?? 0;
    return leading + (decoded === 0n ? 0 : Math.ceil(decoded.toString(16).length / 2)) === 32;
}, 'Invalid 32-byte Solana public key');
export const paymentInput = z.object({ agent_id: z.string().uuid(), idempotency_key: z.string().min(1).max(100), recipient_pubkey: pubkey, amount_lamports: z.string().regex(/^\d{1,19}$/).transform(v => BigInt(v).toString()).refine(v => BigInt(v) > 0n && BigInt(v) <= 9223372036854775807n), purpose: z.string().max(500).default('') }).strict();
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export class PaymentService {
    constructor(private repo = new PaymentRepository(), private network: PaymentNetwork = new DevnetPaymentNetwork(), private encryptionKey?: string) {
    }
    private key() {
        const value = this.encryptionKey ?? config.payments.signerEncryptionKey;
        const key = Buffer.from(value, 'base64');
        if (key.length !== 32 || key.toString('base64') !== value)
            throw paymentError('Signer encryption key is not configured', 501);
        return key;
    }
    private encrypt(secret: Buffer, vaultId: string) {
        const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.key(), iv);
        cipher.setAAD(Buffer.from(vaultId));
        const bytes = Buffer.concat([cipher.update(secret), cipher.final()]);
        return [iv, cipher.getAuthTag(), bytes].map(b => b.toString('base64')).join('.');
    }
    private decrypt(value: string, vaultId: string) {
        const [iv, tag, bytes] = value.split('.').map(v => Buffer.from(v, 'base64'));
        const cipher = createDecipheriv('aes-256-gcm', this.key(), iv);
        cipher.setAAD(Buffer.from(vaultId));
        cipher.setAuthTag(tag);
        return Buffer.concat([cipher.update(bytes), cipher.final()]);
    }
    async createVault(owner: Owner, input: {
        daily_cap_lamports?: string;
    } = {}) {
        const cap = z.string().regex(/^\d{1,19}$/).refine(v => BigInt(v) > 0n && BigInt(v) <= 9223372036854775807n).parse(input.daily_cap_lamports ?? "1000000000");
        this.key();
        await this.network.guard();
        const pair = generateKeyPairSync('ed25519');
        const seed = pair.privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(-32), publicBytes = pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
        const address = base58(publicBytes);
        return this.repo.transaction(async (c) => {
            const v = await this.repo.createVault(c, owner, address, cap);
            await this.repo.storeSigner(c, v.id, address, this.encrypt(Buffer.concat([seed, publicBytes]), v.id));
            await this.repo.audit(c, v.id, owner.owner_pubkey, 'DEVNET_VAULT_CREATED', v.id, null, { public_key: address, execution_mode: v.execution_mode });
            return v;
        });
    }
    async paymentConfig(owner: Owner, id: string) {
        return this.repo.locked(id, async (c) => {
            const v = await this.repo.vault(c, id, owner), usage = await this.repo.usage(c, '00000000-0000-0000-0000-000000000000', id, null);
            let balance: bigint | null = null;
            if (v.encrypted_key) {
                try {
                    await this.network.guard();
                    balance = await this.network.balance(v.vault_pubkey);
                }
                catch { /* Unknown RPC balance is never displayed as zero. */
                }
            }
            const available = balance === null ? null : balance - BigInt(usage.pending_balance);
            return { vault_id: id, execution_mode: v.execution_mode, mode_version: v.mode_version, signer_ready: !!v.encrypted_key, daily_cap_lamports: v.daily_cap_lamports, network: 'devnet', payments_enabled: config.payments.enabled, balance_lamports: balance?.toString() ?? null, reserved_lamports: usage.pending_balance, available_lamports: available === null ? null : (available < 0n ? 0n : available).toString(), spent_24h_lamports: usage.settled_spent, committed_24h_lamports: usage.vault_spent };
        });
    }
    async setMode(owner: Owner, id: string, mode: 'AUTOMATIC' | 'MANUAL', version?: string, dailyCap?: string) {
        return this.repo.locked(id, async (c) => {
            await this.repo.begin(c);
            try {
                const v = await this.repo.vault(c, id, owner);
                if (version && String(v.mode_version) !== version)
                    throw paymentError('Payment mode changed; reload configuration');
                if (dailyCap !== undefined) {
                    z.string().regex(/^\d{1,19}$/).refine(x => BigInt(x) > 0n && BigInt(x) <= 9223372036854775807n).parse(dailyCap);
                    await this.repo.setCap(c, id, dailyCap);
                    await this.repo.audit(c, id, owner.owner_pubkey, 'VAULT_PAYMENT_CAP_CHANGED', id, { daily_cap_lamports: v.daily_cap_lamports }, { daily_cap_lamports: dailyCap });
                }
                if (v.execution_mode !== mode || dailyCap !== undefined) {
                    await this.repo.setMode(c, id, mode);
                    if (mode === 'MANUAL')
                        await this.repo.requireQueuedApproval(c, id);
                    await this.repo.audit(c, id, owner.owner_pubkey, 'PAYMENT_MODE_CHANGED', id, { execution_mode: v.execution_mode }, { execution_mode: mode });
                }
                await this.repo.commit(c);
                return { vault_id: id, execution_mode: mode, mode_version: String(BigInt(v.mode_version) + (v.execution_mode !== mode || dailyCap !== undefined ? 1n : 0n)), signer_ready: !!v.encrypted_key, daily_cap_lamports: dailyCap ?? v.daily_cap_lamports, network: 'devnet' };
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    async issueCredential(owner: Owner, agentId: string, ttl: number) {
        if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400)
            throw paymentError('Credential TTL must be 60 to 86400 seconds', 400);
        const id = await this.repo.vaultIdForAgent(agentId);
        return this.repo.locked(id, async (c) => {
            await this.repo.begin(c);
            try {
                await this.repo.vault(c, id, owner);
                const token = randomBytes(32).toString('base64url');
                const row = await this.repo.issueCredential(c, agentId, hash(token), ttl);
                await this.repo.audit(c, id, owner.owner_pubkey, 'AGENT_CREDENTIAL_ISSUED', agentId, null, { credential_id: row.id, expires_at: row.expires_at });
                await this.repo.commit(c);
                return { ...row, token };
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    async revokeCredential(owner: Owner, agentId: string, credentialId: string) {
        const id = await this.repo.vaultIdForAgent(agentId);
        return this.repo.locked(id, async (c) => {
            await this.repo.begin(c);
            try {
                await this.repo.vault(c, id, owner);
                const row = await this.repo.revokeCredential(c, credentialId, agentId);
                if (!row)
                    throw paymentError('Credential not found', 404);
                await this.repo.audit(c, id, owner.owner_pubkey, 'AGENT_CREDENTIAL_REVOKED', agentId, null, { credential_id: credentialId });
                await this.repo.commit(c);
                return row;
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    private async validate(c: PoolClient, v: any, a: any, t: any, fee: bigint, balance: bigint) {
        if (v.status !== 'ACTIVE' || a.status !== 'ACTIVE')
            throw paymentError('Vault or agent is frozen');
        if (!v.encrypted_key || v.vault_pubkey !== v.signer_pubkey || v.vault_pubkey === v.owner_pubkey)
            throw paymentError('A separate Devnet signer is required');
        const amount = BigInt(t.amount_lamports), total = amount + fee;
        const usage = await this.repo.usage(c, a.id, v.id, t.id ?? null);
        if (amount > BigInt(a.single_tx_cap_lamports))
            throw paymentError('SINGLE_TX_CAP_EXCEEDED');
        if (BigInt(usage.agent_spent) + amount > BigInt(a.daily_cap_lamports))
            throw paymentError('DAILY_CAP_EXCEEDED');
        const listed = await this.repo.listed(c, a.id, t.recipient_pubkey);
        if ((a.whitelist_enabled || v.policies.block_unlisted_recipients) && !listed)
            throw paymentError('RECIPIENT_NOT_ALLOWED');
        if (BigInt(usage.vault_spent) + total > BigInt(v.daily_cap_lamports))
            throw paymentError('VAULT_DAILY_CAP_EXCEEDED');
        if (balance - BigInt(usage.pending_balance) < total)
            throw paymentError('INSUFFICIENT_BALANCE');
        if (v.policies.pause_on_low_balance && balance - BigInt(usage.pending_balance) - total < BigInt(v.policies.low_balance_threshold_lamports))
            throw paymentError('LOW_BALANCE');
    }
    private async preflight(v: any, recipient: string, amount: string) {
        await this.network.guard();
        if (!v.encrypted_key || v.signer_pubkey !== v.vault_pubkey)
            throw paymentError('A separate Devnet signer is required');
        const secret = this.decrypt(v.encrypted_key, v.id);
        try {
            return { prepared: await this.network.prepare(secret, recipient, BigInt(amount)), balance: await this.network.balance(v.vault_pubkey) };
        }
        finally {
            secret.fill(0);
        }
    }
    async request(token: string, input: unknown, owner?: Owner) {
        const data = paymentInput.parse(input), vaultId = await this.repo.vaultIdForAgent(data.agent_id);
        return this.repo.locked(vaultId, async (c) => {
            const v = await this.repo.vault(c, vaultId, owner), a = await this.repo.agent(c, data.agent_id);
            if (!owner)
                await this.repo.credential(c, hash(token), a.id);
            const requestHash = hash(JSON.stringify(data));
            const prior = await this.repo.prior(c, a.id, data.idempotency_key);
            if (prior) {
                if (prior.request_hash !== requestHash)
                    throw paymentError('Idempotency key already used with a different payload');
                return publicPayment(prior);
            }
            // All RPC work is outside BEGIN; the shared vault advisory lock keeps policies stable.
            const quote = await this.preflight(v, data.recipient_pubkey, data.amount_lamports);
            await this.repo.begin(c);
            try {
                const freshVault = await this.repo.vault(c, vaultId), freshAgent = await this.repo.agent(c, a.id), credential = owner ? null : await this.repo.credential(c, hash(token), a.id);
                try {
                    await this.validate(c, freshVault, freshAgent, data, quote.prepared.fee, quote.balance);
                }
                catch (error) {
                    if ((error as any).status !== 409)
                        throw error;
                    const blocked = await this.repo.insertRequest(c, data, requestHash, credential?.id ?? null, 'NOT_REQUIRED', (error as Error).message);
                    await this.repo.audit(c, vaultId, owner?.owner_pubkey ?? a.id, 'PAYMENT_BLOCKED', blocked.id, null, { error_code: (error as Error).message });
                    await this.repo.commit(c);
                    throw error;
                }
                const manual = freshVault.execution_mode === 'MANUAL' || (freshVault.policies.require_human_approval && BigInt(data.amount_lamports) > BigInt(freshVault.policies.approval_threshold_lamports));
                const row = await this.repo.insertRequest(c, data, requestHash, credential?.id ?? null, manual ? 'PENDING' : 'NOT_REQUIRED');
                await this.repo.audit(c, vaultId, a.id, 'PAYMENT_REQUESTED', row.id, null, { approval_status: row.approval_status, amount_lamports: row.amount_lamports });
                if (manual) {
                    await this.repo.commit(c);
                    return publicPayment(row);
                }
                return await this.dispatch(c, freshVault, freshAgent, row, quote.prepared);
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    private async dispatch(c: PoolClient, v: any, a: any, t: any, prepared: import('./paymentNetwork').PreparedPayment) {
        const row = await this.repo.persistDispatch(c, t.id, prepared);
        await this.repo.audit(c, v.id, a.id, 'PAYMENT_DISPATCH_STARTED', t.id, null, { signature: prepared.signature });
        await this.repo.commit(c);
        try {
            await this.network.send(prepared.bytes, prepared.signature);
            return await this.settle(c, row);
        }
        catch {
            await this.repo.markUnknown(c, t.id, 'RPC_UNCERTAIN');
            return publicPayment({ ...row, settlement_status: 'UNKNOWN', error_code: 'RPC_UNCERTAIN' });
        }
    }
    private async settle(c: PoolClient, t: any) {
        const status = await this.network.status(t.solana_signature, t.signed_tx_reference);
        if (status.state === 'UNKNOWN') {
            await this.repo.markUnknown(c, t.id, 'AWAITING_FINALITY');
            return publicPayment({ ...t, settlement_status: 'UNKNOWN', error_code: 'AWAITING_FINALITY' });
        }
        const row = await this.repo.settle(c, t.id, status.state, status.fee?.toString() ?? t.network_fee_lamports);
        return publicPayment(row);
    }
    async approve(owner: Owner, id: string, expectedModeVersion?: string) {
        const vaultId = await this.repo.vaultIdForPayment(id);
        return this.repo.locked(vaultId, async (c) => {
            const v = await this.repo.vault(c, vaultId, owner);
            const t = await this.repo.payment(c, id);
            if (t.approval_status === 'APPROVED' && t.dispatch_started_at)
                return publicPayment(t);
            if (expectedModeVersion && String(v.mode_version) !== expectedModeVersion)
                throw paymentError('Payment mode changed; reload configuration');
            if (t.approval_status !== 'PENDING' || t.dispatch_started_at)
                throw paymentError('Payment is not awaiting approval');
            if (t.signed_tx_reference)
                throw paymentError('Signed payment requires reconciliation');
            const quote = await this.preflight(v, t.recipient_pubkey, t.amount_lamports);
            await this.repo.begin(c);
            try {
                const freshVault = await this.repo.vault(c, vaultId, owner), a = await this.repo.agent(c, t.agent_id);
                const credential = t.credential_id ? await this.repo.validCredential(c, t.credential_id, true) : true;
                if (!credential)
                    throw paymentError('Agent credential invalid or expired', 401);
                await this.validate(c, freshVault, a, t, quote.prepared.fee, quote.balance);
                await this.repo.approve(c, id, owner.owner_pubkey);
                await this.repo.audit(c, vaultId, owner.owner_pubkey, 'PAYMENT_APPROVED', id);
                return await this.dispatch(c, freshVault, a, t, quote.prepared);
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    async reject(owner: Owner, id: string) {
        const vaultId = await this.repo.vaultIdForPayment(id);
        return this.repo.locked(vaultId, async (c) => {
            await this.repo.begin(c);
            try {
                await this.repo.vault(c, vaultId, owner);
                const t = await this.repo.payment(c, id, true);
                if (t.approval_status !== 'PENDING' || t.dispatch_started_at)
                    throw paymentError('Payment is not awaiting approval');
                if (t.signed_tx_reference)
                    throw paymentError('Signed payment requires reconciliation');
                const row = await this.repo.reject(c, id);
                await this.repo.audit(c, vaultId, owner.owner_pubkey, 'PAYMENT_REJECTED', id);
                await this.repo.commit(c);
                return publicPayment(row);
            }
            catch (e) {
                await this.repo.rollback(c);
                throw e;
            }
        });
    }
    requestOwner(owner: Owner, input: unknown) {
        return this.request("", input, owner);
    }
    detail(owner: Owner, id: string) {
        return this.repo.detail(owner, id);
    }
    list(owner: Owner, filter: {
        approval_status?: string;
        vault_id?: string;
        limit?: number;
        offset?: number;
    } = {}) {
        return this.repo.list(owner, filter);
    }
    async reconcile() {
        await this.network.guard();
        for (const pending of await this.repo.pending()) {
            await this.repo.locked(pending.vault_id, async (c) => {
                const t = await this.repo.payment(c, pending.id);
                if (!['RESERVED', 'SUBMITTED', 'UNKNOWN'].includes(t.settlement_status))
                    return;
                try {
                    const settled = await this.settle(c, t);
                    if (settled.settlement_status !== 'UNKNOWN' || !this.network.canResend || !(await this.network.canResend(Number(t.last_valid_block_height))))
                        return;
                    const v = await this.repo.vault(c, pending.vault_id), a = await this.repo.agent(c, t.agent_id);
                    // Reconciliation always follows sent transactions. Rebroadcast is optional and
                    // uses the identical signature only while current controls still allow sending.
                    if (v.status !== 'ACTIVE' || a.status !== 'ACTIVE' || t.approval_status === 'PENDING' || (v.execution_mode === 'MANUAL' && t.approval_status !== 'APPROVED'))
                        return;
                    const credential = t.credential_id ? await this.repo.validCredential(c, t.credential_id) : true;
                    if (!credential)
                        return;
                    const balance = await this.network.balance(v.vault_pubkey);
                    await this.repo.begin(c);
                    try {
                        await this.validate(c, v, a, t, BigInt(t.network_fee_lamports), balance);
                        await this.repo.commit(c);
                    }
                    catch (e) {
                        await this.repo.rollback(c);
                        throw e;
                    }
                    await this.network.send(t.signed_tx_reference, t.solana_signature);
                    await this.settle(c, t);
                }
                catch { /* Keep durable reservation on RPC failure, expiry or inconsistent evidence. */
                }
                finally {
                    await this.repo.markReconciled(c, t.id);
                }
            });
        }
    }
}
