// Local offensive regression tests. PostgreSQL and Ed25519 are real;
// all RPC operations are forbidden and no transaction may be broadcast.
jest.mock('../services/solanaService', () => ({ SolanaService: class {
  async getBalance() { throw new Error('RPC forbidden in security tests'); }
  async requestAirdrop() { throw new Error('RPC forbidden in security tests'); }
  async processTransfer() { throw new Error('RPC forbidden in security tests'); }
} }));
jest.mock('../services/paymentNetwork', () => ({
  ...jest.requireActual('../services/paymentNetwork'),
  DevnetPaymentNetwork: class {
    async guard() { throw new Error('RPC forbidden in security tests'); }
    async prepare() { throw new Error('Signing forbidden in security tests'); }
    async send() { throw new Error('Broadcast forbidden in security tests'); }
  },
}));
import request from 'supertest';
import { createHash, randomBytes, randomUUID, sign } from 'crypto';
import app from '../app';
import pool from '../db/database';
import { login, wallet, origin } from '../testUtils/walletSession';
const keys = [wallet(), wallet()];
let sessions: any[], vaults: any[], agents: any[], payment: any, credential: any;
const policies = { pause_on_low_balance: false, low_balance_threshold_lamports: '0', require_human_approval: false, approval_threshold_lamports: '0', block_unlisted_recipients: false };
function attack(method: 'post'|'patch'|'delete', path: string, body: any = {}, owner = 1) {
  return request(app)[method](path).set('Origin', origin).set('X-AgentSafe-CSRF', '1').set('Cookie', sessions[owner].cookie).send(body);
}
const read = (path: string, owner = 1) => request(app).get(path).set('Cookie', sessions[owner].cookie);
beforeAll(async () => {
  sessions = await Promise.all(keys.map(k => login(k)));
  vaults = []; agents = [];
  for (let owner = 0; owner < 2; owner++) {
    const v = await attack('post', '/api/vaults/local', {owner_pubkey: keys[owner].pubkey}, owner);
    expect(v.status).toBe(200); vaults.push(v.body.data);
    const a = await attack('post', '/api/agents', {vault_id: vaults[owner].id, name: 'Security fixture ' + randomUUID(), role: 'test', agent_pubkey: keys[owner].pubkey, daily_cap_lamports: '100000', single_tx_cap_lamports: '100000'}, owner);
    expect(a.status).toBe(201); agents.push(a.body.data);
  }
  payment = (await pool.query("INSERT INTO transactions(agent_id,idempotency_key,request_hash,recipient_pubkey,amount_lamports,decision,settlement_status,approval_status,signed_tx_reference) VALUES($1,$2,'fixture',$3,1,'APPROVED','NOT_SUBMITTED','PENDING',NULL) RETURNING id", [agents[0].id, randomUUID(), keys[0].pubkey])).rows[0];
  const issued = await attack('post', '/api/agents/'+agents[0].id+'/credentials', {}, 0);
  expect(issued.status).toBe(201); credential = issued.body.data;
});
afterAll(async () => {
  // Cleanup only generated wallet identities, never unrelated application data.
  for (const key of keys) {
    const u = (await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1',[key.pubkey])).rows[0];
    if (u) {
      await pool.query('DELETE FROM transactions WHERE agent_id IN(SELECT a.id FROM agents a JOIN vaults v ON v.id=a.vault_id WHERE v.user_id=$1)',[u.user_id]);
      await pool.query('DELETE FROM vaults WHERE user_id=$1',[u.user_id]);
      await pool.query('DELETE FROM auth_sessions WHERE user_id=$1',[u.user_id]);
      await pool.query('DELETE FROM wallet_identities WHERE user_id=$1',[u.user_id]);
      await pool.query('DELETE FROM users WHERE id=$1',[u.user_id]);
    }
    await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1',[key.pubkey]);
  }
  await pool.end();
});
test.each(['', 'agentsafe_session=forged', 'agentsafe_session='+randomBytes(32).toString('base64url')])('forged or missing session cannot read protected resources (%#)', async cookie => {
  for (const path of ['/api/dashboard','/api/vaults','/api/agents','/api/payments','/api/notifications','/api/simulator/history']) {
    const r = await request(app).get(path).set('Cookie',cookie);
    expect(r.status).toBe(401);
  }
});
test('valid signed challenge cannot be used in a different browser or origin', async () => {
  const c = await attack('post','/api/auth/challenge',{owner_pubkey:keys[0].pubkey},0);
  const input = {challenge_id:c.body.data.challenge_id,signature:sign(null,Buffer.from(c.body.data.message),keys[0].privateKey).toString('base64')};
  expect((await attack('post','/api/auth/verify',input)).status).toBe(401);
  const wrongOrigin = await request(app).post('/api/auth/verify').set('Origin','https://evil.invalid').set('X-AgentSafe-CSRF','1').set('Cookie',c.headers['set-cookie'][0].split(';')[0]).send(input);
  expect(wrongOrigin.status).toBe(403);
  input.signature = sign(null,Buffer.from(c.body.data.message),keys[1].privateKey).toString('base64');
  const wrongSignature = await request(app).post('/api/auth/verify').set('Origin',origin).set('X-AgentSafe-CSRF','1').set('Cookie',c.headers['set-cookie'][0].split(';')[0]).send(input);
  expect(wrongSignature.status).toBe(401);
});
test.each([undefined,'https://evil.invalid','null',origin+', https://evil.invalid',origin+'/',origin+'.evil.invalid'])('mutations reject missing, foreign or ambiguous Origin (%#)',async suppliedOrigin => {
  const r = request(app).patch('/api/agents/'+agents[0].id).set('Cookie',sessions[0].cookie).set('X-AgentSafe-CSRF','1');
  if (suppliedOrigin) r.set('Origin',suppliedOrigin);
  expect((await r.send({status:'FROZEN'})).status).toBe(403);
});
test.each([undefined,'0','1, 1','true'])('mutations reject missing or invalid CSRF header (%#)', async csrf => {
  const r = request(app).patch('/api/agents/'+agents[0].id).set('Cookie',sessions[0].cookie).set('Origin',origin);
  if(csrf) r.set('X-AgentSafe-CSRF',csrf);
  expect((await r.send({status:'FROZEN'})).status).toBe(403);
});
test('GET with method override headers cannot mutate a resource', async () => {
  await read('/api/agents/'+agents[0].id,0).set('X-HTTP-Method-Override','PATCH').send({status:'FROZEN'});
  expect((await pool.query('SELECT status FROM agents WHERE id=$1',[agents[0].id])).rows[0].status).toBe('ACTIVE');
});
test('all payment and credential resource routes reject cross-wallet IDs',async () => {
  const paymentInput = {agent_id:agents[0].id,idempotency_key:randomUUID(),recipient_pubkey:keys[0].pubkey,amount_lamports:'1'};
  const checks = [
    await read('/api/payments/'+payment.id),
    await read('/api/vaults/'+vaults[0].id+'/payment-config'),
    await attack('patch','/api/vaults/'+vaults[0].id+'/payment-config',{execution_mode:'AUTOMATIC',expected_mode_version:'1'}),
    await attack('post','/api/agents/'+agents[0].id+'/credentials',{}),
    await attack('delete','/api/agents/'+agents[0].id+'/credentials/'+credential.id),
    await attack('post','/api/payments',paymentInput),
    await attack('post','/api/transactions',{agent_id:agents[0].id,recipient_pubkey:keys[0].pubkey,amount_lamports:'1',idempotency_key:randomUUID()}),
    await attack('post','/api/payments/'+payment.id+'/approve',{expected_mode_version:'1'}),
    await attack('post','/api/payments/'+payment.id+'/reject'),
  ];
  // Legacy transfer adapter is disabled (501) when payment feature is disabled.
  expect(checks.map(r=>r.status)).toEqual([404,404,404,404,404,404,501,404,404]);
  expect((await read('/api/payments?vault_id='+vaults[0].id)).body.data).toEqual([]);
  const row = (await pool.query('SELECT approval_status FROM transactions WHERE id=$1',[payment.id])).rows[0];
  expect(row.approval_status).toBe('PENDING');
  expect((await pool.query('SELECT revoked_at FROM agent_credentials WHERE id=$1',[credential.id])).rows[0].revoked_at).toBeNull();
});
test('legacy management routes, history and aggregates remain wallet scoped',async () => {
  const checks = [
    await attack('patch','/api/agents/'+agents[0].id,{name:'Stolen'}),
    await attack('patch','/api/agents/'+agents[0].id+'/whitelist',{recipients:[]}),
    await attack('patch','/api/vaults/'+vaults[0].id,{status:'FROZEN'}),
    await attack('patch','/api/vaults/'+vaults[0].id+'/policies',policies),
    await attack('post','/api/vaults/'+vaults[0].id+'/optimize'),
    await attack('post','/api/dashboard/deposit',{vault_id:vaults[0].id,amountSol:1}),
    await read('/api/agents/'+agents[0].id+'/history'),
    await attack('post','/api/simulator/evaluate',{agent_id:agents[0].id,recipient_pubkey:keys[0].pubkey,amount_lamports:'1',request_id:randomUUID()}),
  ];
  expect(checks.map(r=>r.status)).toEqual(Array(checks.length).fill(404));
  expect((await read('/api/agents')).body.data.map((a:any)=>a.id)).toEqual([agents[1].id]);
  expect((await read('/api/dashboard')).body.data.transactions).toEqual([]);
  expect((await read('/api/notifications')).body.data).toEqual([]);
  expect((await read('/api/simulator/history')).body.data).toEqual([]);
});
test.each(['user_id','owner_pubkey','vault_id','execution_mode','encrypted_key','signed_tx_reference'])('mass assignment of %s is rejected',async property => {
  expect((await attack('patch','/api/agents/'+agents[0].id,{name:'Changed',[property]:keys[1].pubkey},0)).status).toBe(400);
});
test.each(['-1','0','1.1','1e20','9223372036854775808','9999999999999999999999999999999999999'])('payment rejects invalid or overflowing amount %s before network',async amount => {
  const r=await attack('post','/api/payments',{agent_id:agents[0].id,idempotency_key:randomUUID(),recipient_pubkey:keys[0].pubkey,amount_lamports:amount},0);
  expect(r.status).toBe(400);
});
test('benign SQL injection is stored only as text and encoded IDs are rejected', async () => {
  const payload = "fixture' OR '1'='1";
  expect((await attack('patch','/api/agents/'+agents[0].id,{name:payload},0)).status).toBe(200);
  const names = (await pool.query('SELECT id,name FROM agents WHERE id=ANY($1::uuid[])',[agents.map(a=>a.id)])).rows;
  expect(names.find(a=>a.id===agents[0].id).name).toBe(payload);
  expect(names.find(a=>a.id===agents[1].id).name).not.toBe(payload);
  const r = await attack('patch','/api/agents/'+encodeURIComponent(payload),{name:'injected'},0);
  expect(r.status).toBe(400);
  expect(JSON.stringify(r.body)).not.toMatch(/SQLSTATE|syntax error|pg-protocol|node_modules/);
});
test('unknown query properties and malformed encoded paths produce safe rejection',async()=>{
  expect((await read('/api/payments?owner_pubkey='+keys[0].pubkey)).status).toBe(400);
  const r=await read('/api/agents/%E0%A4%A/history');
  expect(r.status).toBe(400);
  expect(/URIError|node_modules|\/app\/src|at Layer/.test(r.text)).toBe(false);
  expect(r.type).toBe('application/json');
});
test.each(['malformed','oversized'])('body parser %s errors are JSON without stack disclosure',async kind => {
  const payload=kind==='malformed'?'{"owner_pubkey":':'{"padding":"'+'A'.repeat(110000)+'"}';
  const r=await request(app).post('/api/auth/challenge').set('Origin',origin).set('X-AgentSafe-CSRF','1').set('Content-Type','application/json').send(payload);
  expect(r.status).toBe(kind==='malformed'?400:413);
  expect(/SyntaxError|PayloadTooLargeError|node_modules|\/app\/src|at Layer/.test(r.text)).toBe(false);
  expect(r.type).toBe('application/json');
});
test('expired and revoked session cannot be replayed even with authentic token',async()=>{
  const s=await login(keys[0]);
  await pool.query("UPDATE auth_sessions SET expires_at=NOW()-INTERVAL '1 second' WHERE token_hash=$1",[createHash('sha256').update(s.cookie.split('=')[1]).digest('hex')]);
  expect((await request(app).get('/api/payments').set('Cookie',s.cookie)).status).toBe(401);
  const active=await login(keys[0]);
  expect((await request(app).post('/api/auth/logout').set('Origin',origin).set('X-AgentSafe-CSRF','1').set('Cookie',active.cookie).send({})).status).toBe(200);
  expect((await request(app).get('/api/payments').set('Cookie',active.cookie)).status).toBe(401);
});
