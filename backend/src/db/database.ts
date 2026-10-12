import { Pool } from 'pg';
import dotenv from 'dotenv';
import {config} from '../config/unifiedConfig';

// Carrega as senhas do arquivo .env
dotenv.config();

// Criamos o "Pool" (um conjunto de cabos que ficam conectados no aquário o tempo todo)
const pool = new Pool({
  connectionString: config.db.url,
  ssl: config.db.ssl,
  connectionTimeoutMillis: 3000,
  statement_timeout: 3000,
});

// Mensagem bonitinha para sabermos se deu certo quando ligarmos o servidor
pool.on('connect', () => {
  console.log('[Database] PostgreSQL connection established');
});

// Se a luz acabar ou o docker cair, o sistema avisa do erro
pool.on('error', (err) => {
  console.error('[Database] Connection error', {code:(err as Error & {code?:string}).code});
});

// Exportamos uma função simples para fazermos as queries (os comandos) depois
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
