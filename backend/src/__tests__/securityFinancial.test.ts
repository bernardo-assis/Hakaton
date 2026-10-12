/** Authorized local attack reproductions. Real PostgreSQL + real wallet signatures;
 * only the Solana network is replaced, so these tests cannot spend any funds. */
jest.mock('@solana/web3.js', () => ({ Connection: class {}, PublicKey: class {
    constructor(private value: string) {} toBase58() { return this.value; }
} }));
let mockRpc: any;
jest.mock('../services/paymentNetwork', () => ({ ...jest.requireActual('../services/paymentNetwork'), DevnetPaymentNetwork: class {
    guard() { return mockRpc.guard(); } balance(...args: any[]) { return mockRpc.balance(...args); }
    prepare(...args: any[]) { return mockRpc.prepare(...args); } send(...args: any[]) { return mockRpc.send(...args); }
    status(...args: any[]) { return mockRpc.status(...args); } canResend(...args: any[]) { return mockRpc.canResend(...args); }
} }));
import request from 'supertest';
import { randomUUID } from 'crypto';
import app from '../app';
import pool from '../db/database';
import { config } from '../config/unifiedConfig';
import { login, origin } from '../testUtils/walletSession';
import { PaymentService } from '../services/paymentService';
import { UiRepository } from '../repositories/UiRepository';

const key = Buffer.alloc(32, 29).toString('base64'); // disposable fixture, never production
const sessions: any[] = [];
let identity: any, stranger: any, vault: any, agent: string, credential: any, service: PaymentService;
const input = (label: string, amount = '10000') => ({ agent_id: agent, idempotency_key: label,
    recipient_pubkey: sessions[0].pubkey, amount_lamports: amount, purpose: 'authorized security fixture' });
const post = (path: string, body: any, session = sessions[0]) => request(app).post(path)
    .set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', session.cookie).send(body);
const patch = (path: string, body: any) => request(app).patch(path)
    .set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', sessions[0].cookie).send(body);
const machine = (body: any, token = credential.token) => request(app).post('/api/agent-payments')
    .set('Authorization', 'Bearer ' + token).send(body);
const policies = (overrides: any = {}) => ({ pause_on_low_balance: false, low_balance_threshold_lamports: '0',
    require_human_approval: false, approval_threshold_lamports: '0', block_unlisted_recipients: false, ...overrides });

beforeAll(async () => {
    config.payments.signerEncryptionKey = key; config.payments.enabled = true;
    sessions.push(await login(), await login());
    const owners = await Promise.all(sessions.map(async s => ({ owner_pubkey: s.pubkey,
        user_id: (await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1', [s.pubkey])).rows[0].user_id })));
    [identity, stranger] = owners;
});
beforeEach(async () => {
    mockRpc = { guard: jest.fn(async () => {}), balance: jest.fn(async () => 1000000n),
        prepare: jest.fn(async () => ({ fee: 5000n, bytes: Buffer.from('non-chain-security-fixture').toString('base64'),
            signature: 'fixture-' + randomUUID(), blockhash: sessions[0].pubkey, lastValidBlockHeight: 100 })),
        send: jest.fn(async () => {}), status: jest.fn(async () => ({ state: 'CONFIRMED', fee: 5000n })),
        canResend: jest.fn(async () => true) };
    service = new PaymentService(undefined, mockRpc, key);
    vault = await service.createVault(identity, { daily_cap_lamports: '1000000' });
    agent = (await pool.query("INSERT INTO agents(vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES($1,'security-fixture','test',$2,100000,100000) RETURNING id",
        [vault.id, identity.owner_pubkey])).rows[0].id;
    credential = await service.issueCredential(identity, agent, 3600);
});
afterEach(async () => {
    // No application recovery worker sees entries in subsequent test cases.
    if (vault) { await pool.query('DELETE FROM transactions WHERE agent_id IN(SELECT id FROM agents WHERE vault_id=$1)', [vault.id]);
        await pool.query('DELETE FROM vaults WHERE id=$1', [vault.id]); }
});
afterAll(async () => {
    for (const s of sessions) {
        const row = (await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1', [s.pubkey])).rows[0];
        if (row) { await pool.query('DELETE FROM auth_sessions WHERE user_id=$1', [row.user_id]);
            await pool.query('DELETE FROM wallet_identities WHERE user_id=$1', [row.user_id]);
            await pool.query('DELETE FROM users WHERE id=$1', [row.user_id]); }
        await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1', [s.pubkey]);
    }
    await pool.end();
});

test.each(['0', '-1', '1.5', '1e9', '9223372036854775808', '9'.repeat(20), 10000, null])(
    'HTTP attacker cannot submit malformed payment amount %p', async amount => {
        const response = await machine({ ...input('invalid'), amount_lamports: amount });
        expect(response.status).toBe(400); expect(mockRpc.send).not.toHaveBeenCalled(); expect(mockRpc.prepare).not.toHaveBeenCalled();
    });
test('HTTP attacker cannot inject owner, approval, status or signer fields into payment', async () => {
    const response = await machine({ ...input('spoof'), owner_pubkey: identity.owner_pubkey, user_id: identity.user_id,
        approval_status: 'APPROVED', settlement_status: 'CONFIRMED', encrypted_key: 'spoof' });
    expect(response.status).toBe(400); expect(mockRpc.send).not.toHaveBeenCalled();
});
test('stolen agent credential cannot select another agent, even in the same vault', async () => {
    const other = (await pool.query("INSERT INTO agents(vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES($1,'other','test',$2,100000,100000) RETURNING id", [vault.id, stranger.owner_pubkey])).rows[0].id;
    expect((await machine({ ...input('other-agent'), agent_id: other })).status).toBe(401);
    expect(mockRpc.send).not.toHaveBeenCalled();
});
test('stolen agent credential grants no owner session for approval or configuration', async () => {
    await service.setMode(identity, vault.id, 'MANUAL');
    const pending = await service.request(credential.token, input('manual-stolen'));
    const approval = await request(app).post('/api/payments/' + pending.id + '/approve')
        .set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Authorization', 'Bearer ' + credential.token)
        .send({ expected_mode_version: '2' });
    const mode = await request(app).patch('/api/vaults/' + vault.id + '/payment-config')
        .set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Authorization', 'Bearer ' + credential.token)
        .send({ execution_mode: 'AUTOMATIC', expected_mode_version: '2' });
    expect(approval.status).toBe(401); expect(mode.status).toBe(401); expect(mockRpc.send).not.toHaveBeenCalled();
});
test('a stolen still-valid machine token CAN spend its agent allowance when whitelist is disabled', async () => {
    // Expected authority, not a bypass: disclose this limit instead of claiming
    // that token theft is harmless. Enable a whitelist/manual approval to reduce it.
    const response = await machine({ ...input('allowed-stolen'), recipient_pubkey: stranger.owner_pubkey });
    expect(response.status).toBe(200); expect(response.body.data.recipient_pubkey).toBe(stranger.owner_pubkey);
    expect(response.body.data.settlement_status).toBe('CONFIRMED'); expect(mockRpc.send).toHaveBeenCalledTimes(1);
    expect(response.body.data.signed_tx_reference).toBeUndefined();
});
test('HTTP authenticated other wallet cannot request or inspect victim payment', async () => {
    const rejected = await post('/api/payments', input('cross-wallet'), sessions[1]);
    expect(rejected.status).toBe(404);
    await service.setMode(identity, vault.id, 'MANUAL');
    const pending = await service.request(credential.token, input('private'));
    const detail = await request(app).get('/api/payments/' + pending.id).set('Cookie', sessions[1].cookie);
    expect(detail.status).toBe(404); expect(mockRpc.send).not.toHaveBeenCalled();
});
test('HTTP approval cannot replace recipient or amount of an existing manual request', async () => {
    await service.setMode(identity, vault.id, 'MANUAL');
    const pending = await service.request(credential.token, input('manual-inject'));
    const response = await post('/api/payments/' + pending.id + '/approve', { expected_mode_version: '2',
        recipient_pubkey: stranger.owner_pubkey, amount_lamports: '1' });
    expect(response.status).toBe(400); expect(mockRpc.send).not.toHaveBeenCalled();
    expect((await service.detail(identity, pending.id)).approval_status).toBe('PENDING');
});
test('parallel identical requests transmit once; conflicting same-key payload cannot overwrite', async () => {
    const [a, b] = await Promise.all([service.request(credential.token, input('parallel')),
        service.request(credential.token, input('parallel', '010000'))]);
    expect(a.id).toBe(b.id); expect(mockRpc.send).toHaveBeenCalledTimes(1);
    await expect(service.request(credential.token, { ...input('parallel'), recipient_pubkey: stranger.owner_pubkey }))
        .rejects.toMatchObject({ status: 409 });
    expect((await service.detail(identity, a.id)).recipient_pubkey).toBe(identity.owner_pubkey);
});
test('revocation completed before a request denies even a previously accepted idempotency key', async () => {
    await service.request(credential.token, input('accepted'));
    await service.revokeCredential(identity, agent, credential.id);
    await expect(service.request(credential.token, input('accepted'))).rejects.toMatchObject({ status: 401 });
    expect(mockRpc.send).toHaveBeenCalledTimes(1);
});
test('queued credential revocation wins the shared vault lock before a waiting attacker request', async () => {
    const c = await pool.connect();
    await c.query('SELECT pg_advisory_lock(hashtext($1))', [vault.id]);
    const revoke = service.revokeCredential(identity, agent, credential.id);
    let attack: Promise<any> | undefined;
    try {
        let waiting = false;
        for (let i = 0; i < 40 && !waiting; i++) {
            waiting = (await pool.query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted AND objid=hashtext($1)::bigint & 4294967295) waiting", [vault.id])).rows[0].waiting;
            if (!waiting) await new Promise(r => setTimeout(r, 5));
        }
        expect(waiting).toBe(true);
        attack = service.request(credential.token, input('waiting-revocation')).catch(error => error);
    } finally { await c.query('SELECT pg_advisory_unlock(hashtext($1))', [vault.id]); c.release(); }
    await revoke;
    expect(await attack).toMatchObject({ status: 401 }); expect(mockRpc.send).not.toHaveBeenCalled();
});
test('credential that naturally expires during initial RPC prepare never reaches broadcast', async () => {
    await pool.query("UPDATE agent_credentials SET expires_at=NOW()+INTERVAL '150 milliseconds' WHERE id=$1", [credential.id]);
    const prepare = mockRpc.prepare.getMockImplementation();
    mockRpc.prepare.mockImplementationOnce(async (...args: any[]) => { await new Promise(r => setTimeout(r, 220)); return prepare(...args); });
    await expect(service.request(credential.token, input('expiry-prepare'))).rejects.toMatchObject({ status: 401 });
    expect(mockRpc.send).not.toHaveBeenCalled();
});
test('owner whitelist and balance floor remain mandatory for a stolen valid machine token', async () => {
    const repo = new UiRepository(identity);
    await repo.mutate('vaults', vault.id, { policies: policies({ block_unlisted_recipients: true }) });
    await expect(service.request(credential.token, input('not-listed'))).rejects.toMatchObject({ message: 'RECIPIENT_NOT_ALLOWED' });
    await repo.whitelist(agent, [{ recipient_pubkey: identity.owner_pubkey, label: 'fixture' }]);
    await repo.mutate('vaults', vault.id, { policies: policies({ pause_on_low_balance: true, low_balance_threshold_lamports: '990001' }) });
    await expect(service.request(credential.token, input('floor'))).rejects.toMatchObject({ message: 'LOW_BALANCE' });
    expect(mockRpc.send).not.toHaveBeenCalled();
});
test('shared vault daily budget includes fees across independent agent credentials', async () => {
    await service.setMode(identity, vault.id, 'AUTOMATIC', undefined, '25000');
    const other = (await pool.query("INSERT INTO agents(vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES($1,'other','test',$2,100000,100000) RETURNING id", [vault.id, stranger.owner_pubkey])).rows[0].id;
    const otherCredential = await service.issueCredential(identity, other, 3600);
    const attempts = await Promise.allSettled([service.request(credential.token, input('shared-a')),
        service.request(otherCredential.token, { ...input('shared-b'), agent_id: other })]);
    expect(attempts.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    expect(mockRpc.send).toHaveBeenCalledTimes(1);
});
test('request waits behind owner freeze lock and then uses fresh frozen state', async () => {
    const c = await pool.connect();
    await c.query('BEGIN'); await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [vault.id]);
    const attack = service.request(credential.token, input('waiting-freeze'));
    try {
        await c.query("UPDATE agents SET status='FROZEN' WHERE id=$1", [agent]); await c.query('COMMIT');
        await expect(attack).rejects.toMatchObject({ status: 409 }); expect(mockRpc.send).not.toHaveBeenCalled();
    } finally { await c.query('ROLLBACK'); c.release(); }
});
test('unknown request recovered after service restart retains identical bytes and signature', async () => {
    mockRpc.send.mockRejectedValueOnce(new Error('transport uncertain'));
    const t = await service.request(credential.token, input('restart'));
    mockRpc.status.mockResolvedValueOnce({ state: 'UNKNOWN' });
    const stored = (await pool.query('SELECT signed_tx_reference,solana_signature FROM transactions WHERE id=$1', [t.id])).rows[0];
    const prepares = mockRpc.prepare.mock.calls.length;
    const restarted = new PaymentService(undefined, mockRpc, key); await restarted.reconcile();
    expect(mockRpc.prepare).toHaveBeenCalledTimes(prepares);
    expect(mockRpc.send).toHaveBeenLastCalledWith(stored.signed_tx_reference, stored.solana_signature);
});
test('manual approval replay cannot resend and stale configuration cannot approve', async () => {
    await service.setMode(identity, vault.id, 'MANUAL');
    const pending = await service.request(credential.token, input('manual-replay'));
    await service.setMode(identity, vault.id, 'AUTOMATIC');
    const stale = await post('/api/payments/' + pending.id + '/approve', { expected_mode_version: '2' });
    expect(stale.status).toBe(409); expect(mockRpc.send).not.toHaveBeenCalled();
    const [first, second] = await Promise.all([service.approve(identity, pending.id, '3'), service.approve(identity, pending.id, '3')]);
    expect(first.id).toBe(second.id); expect(mockRpc.send).toHaveBeenCalledTimes(1);
});
test('rejected manual request cannot be released by switching back automatic or replaying token', async () => {
    await service.setMode(identity, vault.id, 'MANUAL');
    const pending = await service.request(credential.token, input('manual-rejected'));
    await service.reject(identity, pending.id); await service.setMode(identity, vault.id, 'AUTOMATIC');
    expect((await service.request(credential.token, input('manual-rejected'))).approval_status).toBe('REJECTED');
    await expect(service.approve(identity, pending.id, '3')).rejects.toMatchObject({ status: 409 });
    expect(mockRpc.send).not.toHaveBeenCalled();
});

// RPC is an operator-selected dependency, not an HTTP parameter controlled by a
// random visitor. These tests verify fail-closed parsing of fabricated RPC replies.
function offlineNetwork() {
    const actual = jest.requireActual('../services/paymentNetwork');
    const sdk = jest.requireActual('@solana/web3.js');
    const signer = sdk.Keypair.generate(), recipient = sdk.Keypair.generate().publicKey;
    const tx = new sdk.Transaction({ feePayer: signer.publicKey, recentBlockhash: signer.publicKey.toBase58() })
        .add(sdk.SystemProgram.transfer({ fromPubkey: signer.publicKey, toPubkey: recipient, lamports: 1 }));
    tx.sign(signer);
    const network = new actual.DevnetPaymentNetwork(); network.sdk = () => sdk;
    const signature = actual.base58(tx.signature);
    network.connection = {
        getGenesisHash: jest.fn(async () => 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'),
        getSignatureStatuses: jest.fn(async () => ({ value: [{ confirmationStatus: 'finalized', err: null, slot: 50 }] })),
        getTransaction: jest.fn(async () => ({ meta: { fee: 5000, err: null }, transaction: { signatures: [signature], message: tx.compileMessage() } })),
        sendRawTransaction: jest.fn(async () => signature),
        getBalanceAndContext: jest.fn(async () => ({ value: 10000, context: { slot: 50 } })),
    };
    return { network, connection: network.connection, signature, bytes: tx.serialize().toString('base64'), signer };
}
test('fabricated RPC cannot enable payment on a different Solana genesis network', async () => {
    const { network, connection } = offlineNetwork(); connection.getGenesisHash.mockResolvedValue('mainnet-genesis');
    await expect(network.guard()).rejects.toMatchObject({ status: 409 });
    expect(connection.sendRawTransaction).not.toHaveBeenCalled();
});
test('fabricated RPC mismatching a broadcast signature fails without claiming confirmation', async () => {
    const { network, connection, signature, bytes } = offlineNetwork();
    connection.sendRawTransaction.mockResolvedValue('different-signature');
    await expect(network.send(bytes, signature)).rejects.toMatchObject({ message: 'RPC signature mismatch' });
});
test('fabricated RPC finalized reply with a different message cannot settle a signed payment', async () => {
    const { network, connection, signature, bytes } = offlineNetwork();
    connection.getTransaction.mockResolvedValue({ meta: { fee: 5000, err: null }, transaction: {
        signatures: [signature], message: { serialize: () => Buffer.from('different-recipient-amount-message') } } });
    await expect(network.status(signature, bytes)).rejects.toMatchObject({ message: 'Confirmed transaction mismatch' });
});
test('fabricated RPC confirmed status without finality is still UNKNOWN', async () => {
    const { network, connection, signature, bytes } = offlineNetwork();
    connection.getSignatureStatuses.mockResolvedValue({ value: [{ confirmationStatus: 'confirmed', err: null, slot: 50 }] });
    expect((await network.status(signature, bytes)).state).toBe('UNKNOWN'); expect(connection.getTransaction).not.toHaveBeenCalled();
});
test('fabricated RPC unsafe balance and inconsistent finality evidence fail closed', async () => {
    const { network, connection, signer, signature, bytes } = offlineNetwork();
    connection.getBalanceAndContext.mockResolvedValue({ value: Number.MAX_SAFE_INTEGER + 1 });
    await expect(network.balance(signer.publicKey.toBase58())).rejects.toMatchObject({ message: 'Balance outside safe RPC range' });
    connection.getSignatureStatuses.mockResolvedValue({ value: [{ confirmationStatus: 'finalized', err: { bad: true }, slot: 50 }] });
    await expect(network.status(signature, bytes)).rejects.toMatchObject({ message: 'Confirmed transaction mismatch' });
});
test('recovery must not rebroadcast when credential naturally expires during RPC balance', async () => {
    mockRpc.send.mockRejectedValueOnce(new Error('transport uncertain'));
    const t = await service.request(credential.token, input('expiry-recovery'));
    await pool.query("UPDATE agent_credentials SET expires_at=NOW()+INTERVAL '150 milliseconds' WHERE id=$1", [credential.id]);
    mockRpc.status.mockResolvedValue({ state: 'UNKNOWN' });
    mockRpc.balance.mockImplementationOnce(async () => { await new Promise(r => setTimeout(r, 220)); return 1000000n; });
    await service.reconcile();
    expect((await service.detail(identity, t.id)).settlement_status).toBe('UNKNOWN');
    expect(mockRpc.send).toHaveBeenCalledTimes(1);
});
test('recovery must honor a newly enabled approval policy without releasing the signed reservation', async () => {
    mockRpc.send.mockRejectedValueOnce(new Error('transport uncertain'));
    const t = await service.request(credential.token, input('approval-policy-recovery'));
    const updated = await patch('/api/vaults/' + vault.id + '/policies', policies({ require_human_approval: true, approval_threshold_lamports: '1' }));
    expect(updated.status).toBe(200);
    mockRpc.status.mockResolvedValue({ state: 'UNKNOWN' });
    await service.reconcile();
    expect((await service.detail(identity, t.id)).settlement_status).toBe('UNKNOWN');
    expect(mockRpc.send).toHaveBeenCalledTimes(1);
});
