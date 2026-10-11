import pool from '../db/database';
import { randomUUID } from 'crypto';
const owner='11111111111111111111111111111111';
const users:string[]=[];
let service:any,vault:any,agent:string,credential:any,identity:any,rpc:any;
beforeEach(async()=>{
 const Service=require('../services/paymentService').PaymentService;
 const user=(await pool.query("INSERT INTO users(email,password_hash) VALUES($1,'fixture') RETURNING id",[randomUUID()+'@safety.test'])).rows[0].id;users.push(user);identity={user_id:user,owner_pubkey:owner};
 rpc={guard:jest.fn(async()=>{}),balance:jest.fn(async()=>1000000n),prepare:jest.fn(async()=>({fee:5000n,bytes:Buffer.from('fixture').toString('base64'),signature:'safety'+randomUUID(),blockhash:owner,lastValidBlockHeight:100})),send:jest.fn(async()=>{}),status:jest.fn(async()=>({state:'CONFIRMED',fee:5000n}))};
 service=new Service(undefined,rpc,Buffer.alloc(32,8).toString('base64'));vault=await service.createVault(identity,{daily_cap_lamports:'1000000000'});
 agent=(await pool.query("INSERT INTO agents(vault_id,name,role,agent_pubkey,daily_cap_lamports,single_tx_cap_lamports) VALUES($1,'safety','test',$2,100000,100000) RETURNING id",[vault.id,owner])).rows[0].id;
 credential=await service.issueCredential(identity,agent,3600);
});
afterAll(async()=>{for(const user of users){await pool.query('DELETE FROM transactions WHERE agent_id IN(SELECT id FROM agents WHERE vault_id IN(SELECT id FROM vaults WHERE user_id=$1))',[user]);await pool.query('DELETE FROM vaults WHERE user_id=$1',[user]);await pool.query('DELETE FROM users WHERE id=$1',[user]);}await pool.end();});
const input=(key:string,amount='10000')=>({agent_id:agent,idempotency_key:key,recipient_pubkey:owner,amount_lamports:amount,purpose:'safety'});
test('agent daily limit counts principal while vault pays network fee',async()=>{
 await pool.query('UPDATE agents SET daily_cap_lamports=10000,single_tx_cap_lamports=10000 WHERE id=$1',[agent]);
 expect((await service.request(credential.token,input('principal'))).settlement_status).toBe('CONFIRMED');
});
test('confirmed transfer is not subtracted twice from current onchain balance',async()=>{
 await service.request(credential.token,input('first'));
 rpc.balance.mockResolvedValue(15000n);
 expect((await service.request(credential.token,input('second'))).settlement_status).toBe('CONFIRMED');
});
test('vault independent daily cap limits total of principal and fee',async()=>{
 await pool.query('UPDATE vaults SET daily_cap_lamports=14999 WHERE id=$1',[vault.id]);
 await expect(service.request(credential.token,input('vault-cap'))).rejects.toMatchObject({status:409});expect(rpc.send).not.toHaveBeenCalled();
});
test('pending uncertain reservations still count after 24h',async()=>{
 rpc.send.mockRejectedValueOnce(new Error('uncertain'));const first=await service.request(credential.token,input('unknown','60000'));
 await pool.query("UPDATE transactions SET reserved_at=NOW()-INTERVAL '48 hours' WHERE id=$1",[first.id]);
 await expect(service.request(credential.token,input('over','50000'))).rejects.toMatchObject({status:409});expect(rpc.send).toHaveBeenCalledTimes(1);
});
test('approval rejects stale mode revision then replays without sending twice',async()=>{
 await service.setMode(identity,vault.id,'MANUAL');const revision=(await service.paymentConfig(identity,vault.id)).mode_version;
 const pending=await service.request(credential.token,input('approval'));
 await service.setMode(identity,vault.id,'AUTOMATIC');
 await expect(service.approve(identity,pending.id,String(revision))).rejects.toMatchObject({status:409});expect(rpc.send).not.toHaveBeenCalled();
 const current=(await service.paymentConfig(identity,vault.id)).mode_version;
 const result=await service.approve(identity,pending.id,String(current));expect(result.settlement_status).toBe('CONFIRMED');
 expect((await service.approve(identity,pending.id,String(current))).id).toBe(pending.id);expect(rpc.send).toHaveBeenCalledTimes(1);
});
test('failure fee settled today counts even if original reservation is old',async()=>{
 rpc.status.mockResolvedValueOnce({state:'FAILED',fee:5000n});const failed=await service.request(credential.token,input('failed'));
 await pool.query("UPDATE transactions SET reserved_at=NOW()-INTERVAL '48 hours',resolved_at=NOW() WHERE id=$1",[failed.id]);
 await pool.query('UPDATE vaults SET daily_cap_lamports=19999 WHERE id=$1',[vault.id]);
 await expect(service.request(credential.token,input('fee-budget'))).rejects.toMatchObject({status:409});expect(rpc.send).toHaveBeenCalledTimes(1);
});
test('other wallet cannot inspect config approve or reject owner payment',async()=>{
 await service.setMode(identity,vault.id,'MANUAL');const pending=await service.request(credential.token,input('private'));
 const stranger={...identity,owner_pubkey:'SysvarRent111111111111111111111111111111111'};
 await expect(service.paymentConfig(stranger,vault.id)).rejects.toMatchObject({status:404});
 await expect(service.approve(stranger,pending.id)).rejects.toMatchObject({status:404});
 await expect(service.reject(stranger,pending.id)).rejects.toMatchObject({status:404});expect(await service.list(stranger)).toEqual([]);expect(rpc.send).not.toHaveBeenCalled();
});
test('panic waits for in-flight broadcaster and prevents following payments',async()=>{
 const {UiRepository}=require('../repositories/UiRepository');
 let release!:()=>void,started!:()=>void;
 const entered=new Promise<void>(resolve=>{started=resolve;});
 const gate=new Promise<void>(resolve=>{release=resolve;});
 rpc.send.mockImplementationOnce(async()=>{started();await gate;});
 const request=service.request(credential.token,input('inflight'));
 await entered;
 let completed=false;const panic=new UiRepository(identity).panic().then((result:any)=>{completed=true;return result;});
 try{
  let waiting=false;
  for(let i=0;i<30&&!waiting;i++){
   waiting=(await pool.query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted AND objid=hashtext($1)::bigint & 4294967295) waiting",[vault.id])).rows[0].waiting;
   if(!waiting)await new Promise(resolve=>setTimeout(resolve,10));
  }
  expect(waiting).toBe(true);expect(completed).toBe(false);
 }finally{release();await request;await panic;}
 await expect(service.request(credential.token,input('after-panic'))).rejects.toMatchObject({status:409});expect(rpc.send).toHaveBeenCalledTimes(1);
});
test('RPC quote broadcast and reconciliation run outside SQL transaction',async()=>{
 const {PaymentRepository}=require('../repositories/PaymentRepository');
 const repository=new PaymentRepository();const originalLocked=repository.locked.bind(repository);let transactionOpen=false;
 repository.locked=(id:string,fn:any)=>originalLocked(id,async(c:any)=>{
  const original=c.query.bind(c);
  c.query=(...args:any[])=>{const sql=typeof args[0]==='string'?args[0]:args[0].text;
   if(sql==='BEGIN')transactionOpen=true;
   if(sql==='COMMIT'||sql==='ROLLBACK')transactionOpen=false;
   return original(...args);
  };
  try{return await fn(c);}finally{c.query=original;transactionOpen=false;}
 });
 for(const method of ['guard','balance','prepare','send','status']){
  const implementation=rpc[method].getMockImplementation();rpc[method].mockImplementation(async(...args:any[])=>{expect(transactionOpen).toBe(false);return implementation(...args);});
 }
 const Service=require('../services/paymentService').PaymentService;
 service=new Service(repository,rpc,Buffer.alloc(32,8).toString('base64'));
 expect((await service.request(credential.token,input('no-sql-rpc'))).settlement_status).toBe('CONFIRMED');
});
