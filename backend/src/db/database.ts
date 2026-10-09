import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carrega as senhas do arquivo .env
dotenv.config();

// Criamos o "Pool" (um conjunto de cabos que ficam conectados no aquário o tempo todo)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mensagem bonitinha para sabermos se deu certo quando ligarmos o servidor
pool.on('connect', () => {
  console.log('🔗 [Database] Conectado ao PostgreSQL com sucesso!');
});

// Se a luz acabar ou o docker cair, o sistema avisa do erro
pool.on('error', (err) => {
  console.error('❌ [Database] Erro fatal na conexão com o banco:', err);
});

// Exportamos uma função simples para fazermos as queries (os comandos) depois
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
