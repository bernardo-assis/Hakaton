import dotenv from "dotenv";
import {readFileSync} from 'fs';
dotenv.config();
function secret(name:string,fallback=''){
  const path=process.env[name+'_FILE'];
  return path?readFileSync(path,'utf8').trim():(process.env[name]??fallback);
}
const trustProxyHops=Number(process.env.TRUST_PROXY_HOPS??0);
if(![0,1].includes(trustProxyHops))throw new Error('TRUST_PROXY_HOPS must be 0 or 1');

export const config = {
  payments: {
    enabled: process.env.DEVNET_PAYMENTS_ENABLED === 'true',
    signerEncryptionKey: secret('VAULT_SIGNER_ENCRYPTION_KEY'),
  },
  auth: {
    production: process.env.NODE_ENV === "production",
    allowedOrigins: (
      process.env.AUTH_ALLOWED_ORIGINS ??
      (process.env.NODE_ENV === "production"
        ? ""
        : "http://localhost:5173,http://127.0.0.1:5173")
    )
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  },
  server: {
    port: Number(process.env.PORT || 3001),
    trustProxyHops,
  },
  db: {
    url: secret('DATABASE_URL')||undefined,
    ssl: process.env.DATABASE_SSL === 'true' ? {rejectUnauthorized:true} : undefined,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    treasurySecretKey: process.env.TREASURY_SECRET_KEY || "[]",
  },
};
