const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {Pool}=require('pg');
require('dotenv').config();
const admin=new Pool({connectionString:process.env.DATABASE_URL});
const directory=path.resolve(__dirname,'../src/db/migrations');
const runner=fs.existsSync(path.resolve(__dirname,'../scripts/migrate.cjs'))?require('../scripts/migrate.cjs'):null;
async function fixture(fn){
 const name='agentsafe_migrate_test_'+crypto.randomBytes(6).toString('hex');
 await admin.query(`CREATE DATABASE "${name}"`);
 const url=new URL(process.env.DATABASE_URL);url.pathname='/'+name;
 const pool=new Pool({connectionString:url.toString()});
 try{await fn(pool);}finally{await pool.end();await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);}
}
function migrate(pool,dir=directory){assert.ok(runner?.runMigrations,'Numbered migration runner is missing');return runner.runMigrations(pool,dir);}
test('fresh database runs numbered migrations exactly once, including concurrent starts',()=>fixture(async pool=>{
 await Promise.all([migrate(pool),migrate(pool)]);
 assert.equal((await pool.query('SELECT COUNT(*)::int count FROM schema_migrations')).rows[0].count,4);
 await migrate(pool);
 assert.equal((await pool.query('SELECT COUNT(*)::int count FROM schema_migrations')).rows[0].count,4);
 assert.ok((await pool.query("SELECT to_regclass('public.vault_signers') signer")).rows[0].signer);
}));
test('existing complete PostgreSQL schema is safely baselined without losing data',()=>fixture(async pool=>{
 for(const name of fs.readdirSync(directory).filter(x=>/^[0-9]+.*\.sql$/.test(x)).sort())await pool.query(fs.readFileSync(path.join(directory,name),'utf8'));
 const marker=(await pool.query("INSERT INTO users(email,password_hash) VALUES('marker@migration.test','fixture') RETURNING id")).rows[0].id;
 await migrate(pool);
 assert.equal((await pool.query('SELECT id FROM users WHERE id=$1',[marker])).rows[0].id,marker);
 assert.equal((await pool.query('SELECT COUNT(*)::int count FROM schema_migrations')).rows[0].count,4);
}));
test('partial legacy database is rejected instead of silently baselined',()=>fixture(async pool=>{
 await pool.query('CREATE TABLE users(id uuid PRIMARY KEY)');
 await assert.rejects(()=>migrate(pool),/schema|baseline/i);
 assert.equal((await pool.query("SELECT to_regclass('public.vaults') vaults")).rows[0].vaults,null);
}));
test('edited applied migration checksum prevents startup and preserves history',()=>fixture(async pool=>{
 await migrate(pool);
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agentsafe-migrations-'));
 try{
  for(const name of fs.readdirSync(directory))fs.copyFileSync(path.join(directory,name),path.join(temp,name));
  fs.appendFileSync(path.join(temp,'0004_devnet_payments.sql'),'\n-- fixture change\n');
  await assert.rejects(()=>migrate(pool,temp),/checksum/i);
  assert.equal((await pool.query('SELECT COUNT(*)::int count FROM schema_migrations')).rows[0].count,4);
 }finally{fs.rmSync(temp,{recursive:true});}
}));
after(()=>admin.end());
