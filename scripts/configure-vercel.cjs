const fs=require('node:fs');
const path=require('node:path');
function configuration(origin){
 const url=new URL(origin);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('API origin must be an HTTPS origin, with no path, credentials or query');
 return {$schema:'https://openapi.vercel.sh/vercel.json',framework:'vite',buildCommand:'npm run build',outputDirectory:'dist',rewrites:[{source:'/api/:path*',destination:url.origin+'/api/:path*'},{source:'/(.*)',destination:'/index.html'}]};
}
module.exports={configuration};
if(require.main===module){
 try{
  const config=configuration(process.argv[2]);
  const output=path.resolve(process.argv[3]||path.resolve(__dirname,'../frontend/vercel.json'));
  fs.writeFileSync(output,JSON.stringify(config,null,2)+'\n');
  console.log('Vercel same-origin API proxy configuration generated. No secrets embedded.');
 }catch{console.error('Usage: node scripts/configure-vercel.cjs https://YOUR_BACKEND_HOST [output-path]');process.exitCode=1;}
}
