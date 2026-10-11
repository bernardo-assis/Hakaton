import pool from '../db/database';
import {PaymentRepository} from '../repositories/PaymentRepository';
test('uncertain oldest batch rotates so newer recovery entries cannot starve',async()=>{
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  // Temporary tables on this connection are invisible to the runtime worker.
  await c.query("CREATE TEMP TABLE agents(id int,vault_id text) ON COMMIT DROP;CREATE TEMP TABLE transactions(id int,agent_id int,settlement_status text,signed_tx_reference text,created_at timestamptz,last_reconciled_at timestamptz) ON COMMIT DROP");
  await c.query("INSERT INTO agents VALUES(1,'fixture');INSERT INTO transactions SELECT i,1,'UNKNOWN','fixture',NOW()-INTERVAL '1 day'+i*INTERVAL '1 second',NULL FROM generate_series(1,101) i");
  const repo=new (PaymentRepository as any)({query:c.query.bind(c),connect:async()=>c});
  const first=await repo.pending();expect(first).toHaveLength(100);expect(first.map((r:any)=>r.id)).not.toContain(101);
  await c.query('UPDATE transactions SET last_reconciled_at=NOW() WHERE id=ANY($1::int[])',[first.map((r:any)=>r.id)]);
  expect((await repo.pending())[0].id).toBe(101);
 }finally{await c.query('ROLLBACK');c.release();}
});
afterAll(()=>pool.end());
