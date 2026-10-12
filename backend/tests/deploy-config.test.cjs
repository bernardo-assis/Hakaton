const {test}=require('node:test');
const assert=require('node:assert/strict');
const {configuration}=require('../../scripts/configure-vercel.cjs');
test('Vercel proxies the API under the browser origin and preserves the API prefix',()=>{
 const config=configuration('https://agentsafe-api.example.test');
 assert.deepEqual(config.rewrites[0],{source:'/api/:path*',destination:'https://agentsafe-api.example.test/api/:path*'});
 assert.equal(config.outputDirectory,'dist');assert.equal(JSON.stringify(config).includes('VAULT_SIGNER'),false);
});
test('proxy generation rejects non-HTTPS URLs and URLs containing credentials or paths',()=>{
 for(const value of ['http://api.example.test','https://user:password@api.example.test','https://api.example.test/api','https://api.example.test/?token=secret'])assert.throws(()=>configuration(value));
});
