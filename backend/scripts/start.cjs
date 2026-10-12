const path=require('node:path');
const fs=require('node:fs');
const {Pool}=require('pg');
const {runMigrations,databaseConfiguration}=require('./migrate.cjs');
(async()=>{
 const pool=new Pool(databaseConfiguration());
 const directory=path.resolve(__dirname,fs.existsSync(path.resolve(__dirname,'../migrations'))?'../migrations':'../src/db/migrations');
 try{await runMigrations(pool,directory);}finally{await pool.end();}
 require('../dist/server.js');
})().catch(error=>{console.error('[startup] refused',{code:error.code||'SCHEMA_OR_CONFIG'});process.exitCode=1;});
