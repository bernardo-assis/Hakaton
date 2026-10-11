import pool from '../db/database';
import { randomUUID } from 'crypto';
const owner = '11111111111111111111111111111111';
let svc: any, user: string, vault: any, agent: string, credential: any;
const rpc: any = { guard: jest.fn(async () => { }), balance: jest.fn(async () => 1000000n), prepare: jest.fn(async () => ({ fee: 5000n, bytes: Buffer.from('signed').toString('base64'), signature: 'testsignature' + randomUUID(), blockhash: owner, lastValidBlockHeight: 100 })), send: jest.fn(async () => { }), status: jest.fn(async () => ({ state: 'CONFIRMED', fee: 5000n })) };
beforeAll(async () => {
    const Service = require('../services/paymentService').PaymentService;
    user = (await pool.query("INSERT INTO users(email,password_hash) VALUES($1,'test') RETURNING id", [randomUUID() + '@payment.test'])).rows[0].id;
    svc = new Service(undefined, rpc, Buffer.alloc(32, 7).toString('base64'));
    vault = await svc.createVault({ user_id: user, owner_pubkey: owner });
    agent = (await pool.query("INSERT INTO agents(vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES($1,'pay','test',$2,100000,50000) RETURNING id", [vault.id, owner])).rows[0].id;
    credential = await svc.issueCredential({ user_id: user, owner_pubkey: owner }, agent, 3600);
});
afterAll(async () => {
    if (user) {
        await pool.query('DELETE FROM transactions WHERE agent_id IN(SELECT id FROM agents WHERE vault_id IN(SELECT id FROM vaults WHERE user_id=$1))', [user]);
        await pool.query('DELETE FROM vaults WHERE user_id=$1', [user]);
        await pool.query('DELETE FROM users WHERE id=$1', [user]);
    }
    await pool.end();
});
const identity = () => ({ user_id: user, owner_pubkey: owner });
const input = (key: string, amount = '10000') => ({ agent_id: agent, idempotency_key: key, recipient_pubkey: owner, amount_lamports: amount, purpose: 'test' });
test('onboarding creates a separate encrypted signer and automatic default', async () => {
    expect(vault.vault_pubkey).not.toBe(owner);
    expect(vault.execution_mode).toBe('AUTOMATIC');
    const stored = (await pool.query('SELECT encrypted_key FROM vault_signers WHERE vault_id=$1', [vault.id])).rows[0];
    expect(stored.encrypted_key).not.toContain('secret');
    expect(vault.encrypted_key).toBeUndefined();
});
test('automatic payment confirms once; replay normalizes amount; conflict rejects', async () => {
    const t = await svc.request(credential.token, input('auto'));
    expect(t.settlement_status).toBe('CONFIRMED');
    expect(t.signed_tx_reference).toBeUndefined();
    const count = rpc.send.mock.calls.length;
    expect((await svc.request(credential.token, input('auto', '010000'))).id).toBe(t.id);
    expect(rpc.send).toHaveBeenCalledTimes(count);
    await expect(svc.request(credential.token, input('auto', '10001'))).rejects.toMatchObject({ status: 409 });
});
test('manual queue remains pending when switching back automatic; approval rechecks freeze', async () => {
    await svc.setMode(identity(), vault.id, 'MANUAL');
    const t = await svc.request(credential.token, input('manual'));
    expect(t.approval_status).toBe('PENDING');
    expect(t.settlement_status).toBe('NOT_SUBMITTED');
    await svc.setMode(identity(), vault.id, 'AUTOMATIC');
    expect((await svc.list(identity())).find((x: any) => x.id === t.id).approval_status).toBe('PENDING');
    await pool.query("UPDATE agents SET status='FROZEN' WHERE id=$1", [agent]);
    await expect(svc.approve(identity(), t.id)).rejects.toMatchObject({ status: 409 });
    await pool.query("UPDATE agents SET status='ACTIVE' WHERE id=$1", [agent]);
    expect((await svc.approve(identity(), t.id)).settlement_status).toBe('CONFIRMED');
});
test('timeout keeps reservation and reconciles without signing a replacement', async () => {
    rpc.send.mockRejectedValueOnce(new Error('timeout'));
    const t = await svc.request(credential.token, input('timeout'));
    expect(t.settlement_status).toBe('UNKNOWN');
    const prepares = rpc.prepare.mock.calls.length;
    await svc.reconcile();
    expect(rpc.prepare).toHaveBeenCalledTimes(prepares);
    expect((await svc.list(identity())).find((x: any) => x.id === t.id).settlement_status).toBe('CONFIRMED');
});
test('concurrent payments share atomic 24h budget and revoked credentials fail', async () => {
    const results = await Promise.allSettled([svc.request(credential.token, input('race1', '40000')), svc.request(credential.token, input('race2', '40000'))]);
    expect(results.filter(x => x.status === 'fulfilled')).toHaveLength(1);
    await svc.revokeCredential(identity(), agent, credential.id);
    await expect(svc.request(credential.token, input('revoked'))).rejects.toMatchObject({ status: 401 });
});
test('blocked policy decision is durable and replay cannot silently pay after unfreeze',async()=>{
 const token=await svc.issueCredential(identity(),agent,3600);
 await pool.query("UPDATE agents SET status='FROZEN' WHERE id=$1",[agent]);
 await expect(svc.request(token.token,input('frozen-durable','1'))).rejects.toMatchObject({status:409});
 await pool.query("UPDATE agents SET status='ACTIVE' WHERE id=$1",[agent]);
 const count=rpc.send.mock.calls.length;
 const replay=await svc.request(token.token,input('frozen-durable','1'));
 expect(replay.decision).toBe('BLOCKED');expect(rpc.send).toHaveBeenCalledTimes(count);
});
test('restart recovery retransmits identical durable bytes without preparing another signature',async()=>{
 const token=await svc.issueCredential(identity(),agent,3600);
 rpc.send.mockRejectedValueOnce(new Error('crash before broadcast'));
 const t=await svc.request(token.token,input('restart-identical','1000'));
 const stored=(await pool.query('SELECT signed_tx_reference,solana_signature FROM transactions WHERE id=$1',[t.id])).rows[0];
 const prepares=rpc.prepare.mock.calls.length;
 rpc.status.mockResolvedValueOnce({state:'UNKNOWN'});rpc.canResend=jest.fn(async()=>true);
 const restarted=new(require('../services/paymentService').PaymentService)(undefined,rpc,Buffer.alloc(32,7).toString('base64'));
 await restarted.reconcile();
 expect(rpc.send).toHaveBeenLastCalledWith(stored.signed_tx_reference,stored.solana_signature);expect(rpc.prepare).toHaveBeenCalledTimes(prepares);
 expect((await restarted.detail(identity(),t.id)).settlement_status).toBe('CONFIRMED');
});
