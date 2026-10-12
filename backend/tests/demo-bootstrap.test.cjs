const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
test('bootstrap persists its generated key and password without putting secrets in the env file',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agentsafe-demo-bootstrap-'));
 try{
  fs.mkdirSync(path.join(root,'scripts'));
  const script=path.join(root,'scripts/init-demo.cjs');
  fs.copyFileSync(path.resolve(__dirname,'../../scripts/init-demo.cjs'),script);
  execFileSync(process.execPath,[script]);
  const key=fs.readFileSync(path.join(root,'.demo-secrets/vault_key'),'utf8').trim();
  const password=fs.readFileSync(path.join(root,'.demo-secrets/postgres_password'),'utf8').trim();
  assert.equal(Buffer.from(key,'base64').length,32);
  assert.equal(fs.statSync(path.join(root,'.demo-secrets')).mode&0o777,0o700);
  const env=fs.readFileSync(path.join(root,'.env.demo'),'utf8');
  assert.ok(!env.includes(key)&&!env.includes(password));assert.match(env,/DEVNET_PAYMENTS_ENABLED=false/);
  execFileSync(process.execPath,[script]);
  assert.ok(key===fs.readFileSync(path.join(root,'.demo-secrets/vault_key'),'utf8').trim());
  assert.ok(password===fs.readFileSync(path.join(root,'.demo-secrets/postgres_password'),'utf8').trim());
 }finally{fs.rmSync(root,{recursive:true});}
});
