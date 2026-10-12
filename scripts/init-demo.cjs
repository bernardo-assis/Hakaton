const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const directory=path.join(root,'.demo-secrets');
fs.mkdirSync(directory,{recursive:true,mode:0o700});fs.chmodSync(directory,0o700);
function persistentSecret(name,generate){
 const file=path.join(directory,name);
 if(!fs.existsSync(file))fs.writeFileSync(file,generate()+'\n',{flag:'wx',mode:0o444});
 return fs.readFileSync(file,'utf8').trim();
}
const password=persistentSecret('postgres_password',()=>crypto.randomBytes(24).toString('hex'));
const key=persistentSecret('vault_key',()=>crypto.randomBytes(32).toString('base64'));
if(Buffer.from(key,'base64').length!==32)throw new Error('Existing signer key invalid; never overwrite it');
persistentSecret('database_url',()=>`postgresql://agentsafe_demo:${password}@postgres:5432/agentsafe_demo`);
const env=path.join(root,'.env.demo');
if(!fs.existsSync(env))fs.writeFileSync(env,'DEMO_HTTP_PORT=8088\nDEVNET_PAYMENTS_ENABLED=false\n',{flag:'wx',mode:0o600});
console.log('Demo configuration ready. Existing database password and signer key preserved.');
