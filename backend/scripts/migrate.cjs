const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {Pool}=require('pg');
require('dotenv').config();
function databaseConfiguration(){
 const url=process.env.DATABASE_URL_FILE?fs.readFileSync(process.env.DATABASE_URL_FILE,'utf8').trim():process.env.DATABASE_URL;
 if(!url)throw new Error('DATABASE_URL or DATABASE_URL_FILE is required');
 return {connectionString:url,connectionTimeoutMillis:10000,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined};
}
const stripTransaction=sql=>sql.replace(/^\s*(BEGIN|COMMIT);\s*$/gm,'');
async function metadata(c,schema){
 const columns=(await c.query('SELECT table_name,column_name,udt_name,character_maximum_length,is_nullable,column_default FROM information_schema.columns WHERE table_schema=$1',[schema])).rows;
 const constraints=(await c.query("SELECT r.relname table_name,pg_get_constraintdef(k.oid) definition FROM pg_constraint k JOIN pg_class r ON r.oid=k.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=$1 AND k.contype IN ('p','u','f')",[schema])).rows;
 const enums=(await c.query('SELECT t.typname,e.enumlabel FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname=$1',[schema])).rows;
 return {columns,constraints,enums};
}
async function verifyBaseline(c,sql){
 const schema='agentsafe_baseline_'+crypto.randomBytes(6).toString('hex');
 await c.query(`CREATE SCHEMA "${schema}"`);
 await c.query(`SET LOCAL search_path TO "${schema}",public`);
 await c.query(sql.replace(/^CREATE EXTENSION[^;]+;\s*/gm,''));
 const expected=await metadata(c,schema),actual=await metadata(c,'public');
 const normalize=value=>value==null?null:value.replaceAll(schema+'.','').replaceAll('public.','').replace(/\s+/g,' ').trim();
 for(const column of expected.columns){
  const found=actual.columns.find(x=>x.table_name===column.table_name&&x.column_name===column.column_name);
  if(!found||found.udt_name!==column.udt_name||found.character_maximum_length!==column.character_maximum_length||(column.is_nullable==='NO'&&found.is_nullable!=='NO')||normalize(found.column_default)!==normalize(column.column_default))throw new Error('Existing schema does not match the initial PostgreSQL baseline');
 }
 for(const key of expected.constraints)if(!actual.constraints.some(x=>x.table_name===key.table_name&&normalize(x.definition)===normalize(key.definition)))throw new Error('Existing schema constraints do not match the initial PostgreSQL baseline');
 for(const value of expected.enums)if(!actual.enums.some(x=>x.typname===value.typname&&x.enumlabel===value.enumlabel))throw new Error('Existing schema enums do not match the initial PostgreSQL baseline');
 await c.query(`DROP SCHEMA "${schema}" CASCADE`);
 await c.query('SET LOCAL search_path TO public');
}
async function runMigrations(pool,directory){
 const names=fs.readdirSync(directory).filter(x=>/^\d{4}_[a-z0-9_]+\.sql$/.test(x)).sort();
 if(!names.length||names[0]!=='0001_initial_schema.sql')throw new Error('Numbered PostgreSQL migrations are missing');
 const c=await pool.connect();let locked=false;
 try{
  await c.query("SELECT pg_advisory_lock(hashtext('agentsafe-schema-migrations'))");locked=true;
  await c.query('CREATE TABLE IF NOT EXISTS public.schema_migrations(name text PRIMARY KEY,checksum char(64) NOT NULL,applied_at timestamptz NOT NULL DEFAULT NOW())');
  const applied=(await c.query('SELECT name,checksum FROM public.schema_migrations')).rows;
  for(const prior of applied)if(!names.includes(prior.name))throw new Error('Applied migration file is missing: '+prior.name);
  for(const name of names){
   const source=fs.readFileSync(path.join(directory,name),'utf8'),checksum=crypto.createHash('sha256').update(source).digest('hex');
   const prior=applied.find(x=>x.name===name);
   if(prior){if(prior.checksum!==checksum)throw new Error('Migration checksum mismatch: '+name);continue;}
   await c.query('BEGIN');
   try{
    await c.query('SET LOCAL search_path TO public');
    if(name==='0001_initial_schema.sql'){
     const tables=[...source.matchAll(/CREATE TABLE\s+([a-z0-9_]+)\s*\(/g)].map(x=>x[1]);
     const existing=(await c.query('SELECT tablename FROM pg_tables WHERE schemaname=\'public\' AND tablename=ANY($1::text[])',[tables])).rowCount;
     if(existing){
      if(existing!==tables.length)throw new Error('Partial existing schema cannot be baselined');
      await verifyBaseline(c,stripTransaction(source));
     }else await c.query(stripTransaction(source));
    }else await c.query(stripTransaction(source));
    await c.query('INSERT INTO public.schema_migrations(name,checksum) VALUES($1,$2)',[name,checksum]);
    await c.query('COMMIT');
    console.log('[migrations] applied',name);
   }catch(error){await c.query('ROLLBACK');throw error;}
  }
 }finally{
  try{if(locked)await c.query("SELECT pg_advisory_unlock(hashtext('agentsafe-schema-migrations'))");}finally{c.release();}
 }
}
module.exports={runMigrations,databaseConfiguration};
if(require.main===module){
 const directory=process.env.MIGRATIONS_DIR||path.resolve(__dirname,fs.existsSync(path.resolve(__dirname,'../migrations'))?'../migrations':'../src/db/migrations');
 const pool=new Pool(databaseConfiguration());
 runMigrations(pool,directory).then(()=>pool.end()).catch(async error=>{console.error('[migrations] startup refused',{code:error.code||'SCHEMA_OR_CHECKSUM'});await pool.end();process.exitCode=1;});
}
