import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("🛠️  Criando uma nova carteira do zero para o Hackathon...");
  const keypair = Keypair.generate();
  
  const publicKey = keypair.publicKey.toBase58();
  const secretKey = Array.from(keypair.secretKey);
  
  console.log(`\n✅ Carteira Criada com Sucesso!`);
  console.log(`Public Key: ${publicKey}`);
  
  console.log("\n⏳ Solicitando Airdrop de 2 SOL na Devnet (dinheiro falso para teste)...");
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  try {
    const signature = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    const latestBlockHash = await connection.getLatestBlockhash();
    
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: signature,
    });
    
    console.log(`✅ Airdrop recebido! Você agora tem 2 SOL.`);
  } catch (err) {
    console.log(`⚠️  O Airdrop falhou (às vezes a Devnet da Solana limita os pedidos).`);
    console.log(`Você pode pedir manualmente acessando faucet.solana.com e colando a Public Key: ${publicKey}`);
  }

  console.log("\n💾 Salvando a sua Chave Secreta no arquivo .env...");
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove chave antiga se existir
  envContent = envContent.replace(/TREASURY_SECRET_KEY=.*\n?/g, '');
  
  // Adiciona a nova chave
  envContent += `\nTREASURY_SECRET_KEY="${JSON.stringify(secretKey)}"\n`;
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  
  console.log(`✅ Tudo Pronto! Arquivo .env atualizado.`);
  console.log(`Reinicie o seu servidor (npm run dev) para ele ler a nova chave!`);
}

main().catch(console.error);
