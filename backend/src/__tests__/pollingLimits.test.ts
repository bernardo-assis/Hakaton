jest.mock('@solana/web3.js',()=>({Connection:class{},PublicKey:class{constructor(private value:string){}toBase58(){return this.value;}}}));
import request from 'supertest';
import app from '../app';
import pool from '../db/database';
import {login,origin} from '../testUtils/walletSession';
let session:any;
test('normal panel polling does not exhaust the financial write budget',async()=>{
 session=await login();
 // More reads than the old entire 15-minute allowance, but within one minute.
 for(let i=0;i<110;i++)expect((await request(app).get('/api/auth/session').set('Cookie',session.cookie)).status).toBe(200);
 const statuses=[];
 for(let i=0;i<31;i++)statuses.push((await request(app).post('/api/payments').set('Cookie',session.cookie).set('Origin',origin).set('X-AgentSafe-CSRF','1').send({})).status);
 expect(statuses.slice(0,30)).toEqual(Array(30).fill(400));expect(statuses[30]).toBe(429);
});
afterAll(async()=>{
 if(session){const u=(await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1',[session.pubkey])).rows[0];if(u){await pool.query('DELETE FROM auth_sessions WHERE user_id=$1',[u.user_id]);await pool.query('DELETE FROM wallet_identities WHERE user_id=$1',[u.user_id]);await pool.query('DELETE FROM users WHERE id=$1',[u.user_id]);}await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1',[session.pubkey]);}await pool.end();
});
