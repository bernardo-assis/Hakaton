const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages';
const files = ['Dashboard.tsx', 'AgentFleet.tsx', 'Simulator.tsx', 'VaultBudgets.tsx'];

const replacements = [
  // Dashboard
  [/2 Este m.s/g, "2 This month"],
  [/Gasto de Today/g, "Today's Spent"],
  [/Tx Blockeds/g, "Blocked Txs"],
  [/Cobertura/g, "Coverage"],
  [/Cofre blindado/g, "Vault protected"],
  [/Volume Di.rio de Transa..es/g, "Daily Transaction Volume"],
  [/Atividade da sua frota nos .ltimos 7 dias/g, "Fleet activity in the last 7 days"],
  [/Transa..es Recentes/g, "Recent Transactions"],
  [/Buscar transa..es/g, "Search transactions"],
  [/Servi.o/g, "Service"],
  [/Nome do Agente/g, "Agent Name"],
  [/Valor/g, "Amount"],
  [/M.tricas Gerais/g, "General Metrics"],
  
  // AgentFleet
  [/Gest.o da Frota de Agentes/g, "Agent Fleet Management"],
  [/Configure, monitore e defina limites para as IAs aut.nomas que operam com seus fundos\./g, "Configure, monitor and set limits for the autonomous AIs operating with your funds."],
  [/Agentes Ativos/g, "Active Agents"],
  [/Bloqueados/g, "Blocked"],
  [/Taxa de Sucesso/g, "Success Rate"],
  [/Transa..es hoje/g, "Transactions today"],
  [/Limite Di.rio/g, "Daily Limit"],
  [/Gasto Hoje/g, "Spent Today"],
  [/Cap por TX/g, "Max per TX"],
  [/Novo Agente/g, "Deploy Agent"],
  [/Crie um novo agente aut.nomo e configure suas pol.ticas de seguran.a\./g, "Deploy a new autonomous agent and configure its security policies."],
  [/Cada agente\. Cada transa..o\. Protegidos\./g, "Every agent. Every transaction. Protected."],
  [/Fun..o \/ Prop.sito/g, "Purpose"],
  [/Chave P.blica Solana \(Wallet\)/g, "Solana Public Key (Wallet)"],
  [/Limite por Transa..o \(USD\)/g, "Per-Transaction Limit (USD)"],
  
  // VaultBudgets
  [/Or.amento dos Cofres/g, "Vault Budgets"],
  [/Distribua limites de liquidez globais para suas frotas de agentes aut.nomos\./g, "Distribute global liquidity limits to your autonomous agent fleets."],
  [/Liquidez Total/g, "Total Liquidity"],
  [/Bloqueado em Cofres/g, "Locked in Vaults"],
  [/Consumo nas .ltimas 24h/g, "24h Consumption"],
  [/Cofre Principal \(DeFi\)/g, "Main Vault (DeFi)"],
  [/Cap Di.rio/g, "Daily Cap"],
  [/Cap por Transa..o/g, "TX Cap"],
  [/Pol.ticas Ativas/g, "Active Policies"],
  [/Trava de Sa.da/g, "Withdrawal Lock"],
  [/Aprova..o Dupla/g, "Dual Approval"],
  [/Whitelist de Contratos/g, "Contract Whitelist"],
  [/Novo Cofre/g, "Deploy Vault"],
  
  // Simulator
  [/Simulador de IA/g, "AI Simulator"],
  [/Assista aos rob.s tentando gastar os fundos do cofre em tempo real\./g, "Watch the bots attempt to spend vault funds in real time."],
  [/Status da Rede/g, "Network Status"],
  [/Conectado \/ Devnet/g, "Connected / Devnet"],
  [/Rob. Comportado/g, "Well-Behaved Bot"],
  [/Respeita os limites do cofre e faz transa..es normais\./g, "Respects vault limits and performs normal transactions."],
  [/Rob. Descontrolado/g, "Rogue Bot"],
  [/Tenta fazer transfer.ncias massivas estourando o or.amento\./g, "Attempts massive transfers blowing past the budget limit."],
  [/Iniciar Simula..o/g, "Start Simulation"],
  [/Parar Simula..o/g, "Stop Simulation"],
  [/Console de Atividades/g, "Activity Console"],
  [/Filtros de Log:/g, "Log Filters:"],
  [/Todos/g, "All"],
  [/Aprovados/g, "Approved"],
  [/Bloqueados/g, "Blocked"],
  [/Aguardando in.cio da simula..o/g, "Waiting to start simulation"],
  [/Nenhuma atividade registrada ainda\./g, "No activity recorded yet."]
];

files.forEach(file => {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  
  let text = fs.readFileSync(p, 'utf8');
  
  replacements.forEach(([regex, repl]) => {
    text = text.replace(regex, repl);
  });
  
  // Manual string replacements for anything else
  text = text.replace(/Trava de S.lida/g, 'Withdrawal Lock');
  text = text.replace(/Transa..es/g, 'Transactions');
  text = text.replace(/Transa..o/g, 'Transaction');
  text = text.replace(/Simula..o/g, 'Simulation');
  text = text.replace(/Configura..o/g, 'Configuration');
  text = text.replace(/Cofre/g, 'Vault');
  
  fs.writeFileSync(p, text, 'utf8');
});

console.log("Translation complete safely!");
