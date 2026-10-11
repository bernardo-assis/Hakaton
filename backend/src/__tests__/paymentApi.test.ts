jest.mock('@solana/web3.js', () => ({ Connection: class {
    }, PublicKey: class {
        constructor(private value: string) { }
        toBase58() { return this.value; }
    } }));
jest.mock('../services/paymentNetwork', () => ({ ...jest.requireActual('../services/paymentNetwork'), DevnetPaymentNetwork: class {
        async guard() { }
        async balance() { return 1000000n; }
        async prepare() { return { fee: 5000n, bytes: Buffer.from('fixture').toString('base64'), signature: require('crypto').randomUUID(), blockhash: '11111111111111111111111111111111', lastValidBlockHeight: 100 }; }
        async send() { }
        async status() { return { state: 'CONFIRMED', fee: 5000n }; }
    } }));
import request from 'supertest';
import app from '../app';
import pool from '../db/database';
import { config } from '../config/unifiedConfig';
import { login, origin } from '../testUtils/walletSession';
let session: any, vault: any, agent: any;
beforeAll(async () => { config.payments.signerEncryptionKey = Buffer.alloc(32, 9).toString('base64'); config.payments.enabled = true; session = await login(); });
const post = (path: string, body: any) => request(app).post(path).set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', session.cookie).send(body);
afterAll(async () => { if (session) {
    const u = (await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1', [session.pubkey])).rows[0];
    if (u) {
        await pool.query('DELETE FROM transactions WHERE agent_id IN(SELECT id FROM agents WHERE vault_id IN(SELECT id FROM vaults WHERE user_id=$1))', [u.user_id]);
        await pool.query('DELETE FROM vaults WHERE user_id=$1', [u.user_id]);
        await pool.query('DELETE FROM auth_sessions WHERE user_id=$1', [u.user_id]);
        await pool.query('DELETE FROM wallet_identities WHERE user_id=$1', [u.user_id]);
        await pool.query('DELETE FROM users WHERE id=$1', [u.user_id]);
    }
    await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1', [session.pubkey]);
} await pool.end(); });
test('owner panel can create separate vault and request a payment without storing an agent credential', async () => {
    const v = await post('/api/vaults/devnet', { daily_cap_lamports: '100000' });
    expect(v.status).toBe(201);
    vault = v.body.data;
    expect(vault.vault_pubkey).not.toBe(session.pubkey);
    const a = await post('/api/agents', { vault_id: vault.id, name: 'Panel', role: 'test', agent_pubkey: session.pubkey, daily_cap_lamports: '100000', single_tx_cap_lamports: '100000' });
    expect(a.status).toBe(201);
    agent = a.body.data;
    const payment = await post('/api/payments', { agent_id: agent.id, idempotency_key: 'panel-test', recipient_pubkey: session.pubkey, amount_lamports: '10000' });
    expect(payment.status).toBe(200);
    expect(payment.body.data.settlement_status).toBe('CONFIRMED');
    expect(payment.body.data.signed_tx_reference).toBeUndefined();
    expect(payment.body.data.credential_id).toBeNull();
});
test('agent machine endpoint requires credential and owner endpoints keep origin and session checks', async () => {
    expect((await request(app).post('/api/agent-payments').send({})).status).toBe(400);
    expect((await request(app).get('/api/payments')).status).toBe(401);
    expect((await request(app).post('/api/payments').set('Cookie', session.cookie).send({})).status).toBe(403);
});
test('panel rejects a recipient that is not a 32-byte public key',async()=>{
 const result=await post('/api/payments',{agent_id:agent.id,idempotency_key:'invalid-key',recipient_pubkey:'1'.repeat(44),amount_lamports:'10000'});
 expect(result.status).toBe(400);
});
test('pending pagination and detail retrieve older queue entries behind recent payments',async()=>{
 const rows=await pool.query("INSERT INTO transactions(agent_id,idempotency_key,request_hash,recipient_pubkey,amount_lamports,decision,settlement_status,approval_status,created_at) SELECT $1,'queue-'||i,'fixture',$2,1,'APPROVED','NOT_SUBMITTED','PENDING',TIMESTAMPTZ '2000-01-01'+i*INTERVAL '1 second' FROM generate_series(1,101) i RETURNING id",[agent.id,session.pubkey]);
 const page=await request(app).get('/api/payments?approval_status=PENDING&offset=100&limit=100').set('Cookie',session.cookie);expect(page.status).toBe(200);expect(page.body.data).toHaveLength(1);
 const detail=await request(app).get('/api/payments/'+rows.rows[0].id).set('Cookie',session.cookie);expect(detail.status).toBe(200);expect(detail.body.data.approval_status).toBe('PENDING');expect(detail.body.data.signed_tx_reference).toBeUndefined();
});
