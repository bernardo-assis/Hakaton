import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 3001,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    treasurySecretKey: process.env.TREASURY_SECRET_KEY || '[]',
  }
};
