jest.mock('@solana/web3.js',()=>({Connection:class{},PublicKey:class{constructor(private value:string){}toBase58(){return this.value;}}}));
import request from 'supertest';
import app from '../app';
import pool from '../db/database';
import {TransactionService} from '../services/transactionService';
import {login,origin} from '../testUtils/walletSession';
let session:any;
afterAll(async()=>{
 if(session){const u=(await pool.query('SELECT user_id FROM wallet_identities WHERE owner_pubkey=$1',[session.pubkey])).rows[0];if(u){await pool.query('DELETE FROM auth_sessions WHERE user_id=$1',[u.user_id]);await pool.query('DELETE FROM wallet_identities WHERE user_id=$1',[u.user_id]);await pool.query('DELETE FROM users WHERE id=$1',[u.user_id]);}await pool.query('DELETE FROM wallet_challenges WHERE owner_pubkey=$1',[session.pubkey]);}await pool.end();
});
test('public liveness and database readiness expose no configuration or wallet data',async()=>{
 const health=await request(app).get('/healthz');expect(health.status).toBe(200);expect(health.body).toEqual({status:'ok'});
 const ready=await request(app).get('/readyz');expect(ready.status).toBe(200);expect(ready.body).toEqual({status:'ready'});
});
test('valid legacy payload cannot invoke global treasury after integration',async()=>{
 session=await login();const process=jest.spyOn(TransactionService.prototype,'processTransaction').mockResolvedValue({fixture:true});
 const response=await request(app).post('/api/transactions').set('Cookie',session.cookie).set('Origin',origin).set('X-AgentSafe-CSRF','1').send({agent_id:'00000000-0000-4000-8000-000000000000',idempotency_key:'valid',request_hash:'valid',recipient_pubkey:session.pubkey,amount_lamports:1});
 expect(response.status).toBe(501);expect(process).not.toHaveBeenCalled();process.mockRestore();
});
