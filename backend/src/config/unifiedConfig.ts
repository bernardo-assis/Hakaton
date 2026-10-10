import dotenv from "dotenv";
dotenv.config();

export const config = {
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
    port: process.env.PORT || 3001,
  },
  db: {
    url: process.env.DATABASE_URL,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    treasurySecretKey: process.env.TREASURY_SECRET_KEY || "[]",
  },
};
