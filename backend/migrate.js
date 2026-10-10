const { Pool } = require('pg');
require('dotenv').config({ path: 'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = "ALTER TABLE vaults ADD COLUMN IF NOT EXISTS policies JSONB NOT NULL DEFAULT '{\"pause_on_low_balance\":false,\"low_balance_threshold_lamports\":\"0\",\"require_human_approval\":false,\"approval_threshold_lamports\":\"0\",\"block_unlisted_recipients\":false}';";
pool.query(sql).then(() => {
  console.log('Migration applied!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
