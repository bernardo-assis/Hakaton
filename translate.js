const fs = require('fs');

const filePaths = [
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Dashboard.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/AgentFleet.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Simulator.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/VaultBudgets.tsx'
];

const dict = {
  'Saudao': 'Greeting',
  'Sauda.?.o': 'Greeting',
  'Segurana da Frota & Controle de Oramento': 'Fleet Security & Budget Control',
  'Seguran.a da Frota & Controle de Or.amento': 'Fleet Security & Budget Control',
  'Total Vault Balance': 'Total Vault Balance',
  'Limite Diorio da Frota': 'Fleet Daily Limit',
  'Limite Di.rio da Frota': 'Fleet Daily Limit',
  'M?tricas \+ Cartes Virtuais': 'Metrics + Virtual Cards',
  'M.tricas \\+ Cart.es Virtuais': 'Metrics + Virtual Cards',
  '2 Este mGs': '2 This month',
  '2 Este m.s': '2 This month',
  'Cartes Virtuais \\(Agent Cards\\)': 'Virtual Cards (Agent Cards)',
  'Cart.es Virtuais \\(Agent Cards\\)': 'Virtual Cards (Agent Cards)',
  'Cartes de Agentes': 'Agent Cards',
  'Cart.es de Agentes': 'Agent Cards',
  'Grofico': 'Chart',
  'Gr.fico': 'Chart',
  'Volume Diorio de Transaes': 'Daily Transaction Volume',
  'Volume Di.rio de Transa..es': 'Daily Transaction Volume',
  'Atividade da sua frota nos gltimos 7 dias': 'Fleet activity in the last 7 days',
  'Atividade da sua frota nos .ltimos 7 dias': 'Fleet activity in the last 7 days',
  'Servio': 'Service',
  'Servi.o': 'Service',

  // Vault Budgets
  'Orçamento dos Cofres': 'Vault Budgets',
  'Or.amento dos Cofres': 'Vault Budgets',
  'Distribua limites de liquidez globais para suas frotas de agentes autônomos.': 'Distribute global liquidity limits to your autonomous agent fleets.',
  'Distribua limites de liquidez globais para suas frotas de agentes aut.nomos\\.': 'Distribute global liquidity limits to your autonomous agent fleets.',
  'Liquidez Total': 'Total Liquidity',
  'Bloqueado em Cofres': 'Locked in Vaults',
  'Consumo nas últimas 24h': '24h Consumption',
  'Consumo nas .ltimas 24h': '24h Consumption',
  'Cofre Principal \\(DeFi\\)': 'Main Vault (DeFi)',
  'Cap Diário': 'Daily Cap',
  'Cap Di.rio': 'Daily Cap',
  'Cap por Transação': 'TX Cap',
  'Cap por Transa..o': 'TX Cap',
  'Políticas Ativas': 'Active Policies',
  'Pol.ticas Ativas': 'Active Policies',
  'Trava de Saída': 'Withdrawal Lock',
  'Trava de Sa.da': 'Withdrawal Lock',
  'Aprovação Dupla': 'Dual Approval',
  'Aprova..o Dupla': 'Dual Approval',
  'Whitelist de Contratos': 'Contract Whitelist',
  'Novo Cofre': 'Deploy Vault',

  // AgentFleet
  'Gestão da Frota de Agentes': 'Agent Fleet Management',
  'Gest.o da Frota de Agentes': 'Agent Fleet Management',
  'Configure, monitore e defina limites para as IAs autônomas que operam com seus fundos.': 'Configure, monitor and set limits for the autonomous AIs operating with your funds.',
  'Configure, monitore e defina limites para as IAs aut.nomas que operam com seus fundos\\.': 'Configure, monitor and set limits for the autonomous AIs operating with your funds.',
  'Agentes Ativos': 'Active Agents',
  'Bloqueados': 'Blocked',
  'Taxa de Sucesso': 'Success Rate',
  'Transações hoje': 'Transactions today',
  'Transa..es hoje': 'Transactions today',
  'Limite Diário': 'Daily Limit',
  'Limite Di.rio': 'Daily Limit',
  'Gasto Hoje': 'Spent Today',
  'Cap por TX': 'Max per TX',
  'Novo Agente': 'Deploy Agent',
  'Crie um novo agente autônomo e configure suas políticas de segurança.': 'Deploy a new autonomous agent and configure its security policies.',
  'Crie um novo agente aut.nomo e configure suas pol.ticas de seguran.a\\.': 'Deploy a new autonomous agent and configure its security policies.',
  'Cada agente\\. Cada transação\\. Protegidos\\.': 'Every agent. Every transaction. Protected.',
  'Cada agente\\. Cada transa..o\\. Protegidos\\.': 'Every agent. Every transaction. Protected.',
  'Função \/ Propósito': 'Purpose',
  'Fun..o \/ Prop.sito': 'Purpose',
  'Chave Pública Solana \\(Wallet\\)': 'Solana Public Key (Wallet)',
  'Chave P.blica Solana \\(Wallet\\)': 'Solana Public Key (Wallet)',
  'Limite por Transação \\(USD\\)': 'Per-Transaction Limit (USD)',
  'Limite por Transa..o \\(USD\\)': 'Per-Transaction Limit (USD)',

  // Simulator
  'Simulador de IA': 'AI Simulator',
  'Assista aos robôs tentando gastar os fundos do cofre em tempo real.': 'Watch the bots attempt to spend vault funds in real time.',
  'Assista aos rob.s tentando gastar os fundos do cofre em tempo real\\.': 'Watch the bots attempt to spend vault funds in real time.',
  'Status da Rede': 'Network Status',
  'Conectado \/ Devnet': 'Connected / Devnet',
  'Robô Comportado': 'Well-Behaved Bot',
  'Rob. Comportado': 'Well-Behaved Bot',
  'Respeita os limites do cofre e faz transações normais.': 'Respects vault limits and performs normal transactions.',
  'Respeita os limites do cofre e faz transa..es normais\\.': 'Respects vault limits and performs normal transactions.',
  'Robô Descontrolado': 'Rogue Bot',
  'Rob. Descontrolado': 'Rogue Bot',
  'Tenta fazer transferências massivas estourando o orçamento.': 'Attempts massive transfers blowing past the budget limit.',
  'Tenta fazer transfer.ncias massivas estourando o or.amento\\.': 'Attempts massive transfers blowing past the budget limit.',
  'Iniciar Simulação': 'Start Simulation',
  'Iniciar Simula..o': 'Start Simulation',
  'Parar Simulação': 'Stop Simulation',
  'Parar Simula..o': 'Stop Simulation',
  'Console de Atividades': 'Activity Console',
  'Filtros de Log:': 'Log Filters:',
  'Todos': 'All',
  'Aprovados': 'Approved',
  'Aguardando início da simulação': 'Waiting to start simulation',
  'Aguardando in.cio da simula..o': 'Waiting to start simulation',
  'Nenhuma atividade registrada ainda.': 'No activity recorded yet.',
  'Nenhuma atividade registrada ainda\\.': 'No activity recorded yet.',
  'Métricas Gerais': 'General Metrics',
  'M.tricas Gerais': 'General Metrics'
};

filePaths.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  for (const [pt, en] of Object.entries(dict)) {
    try {
      const regex = new RegExp(pt, 'g');
      text = text.replace(regex, en);
    } catch(e) {}
  }

  // Wipe out the remaining mojibake manually!
  // Any sequence of uppercase weird characters or things like "Saudauo"
  text = text.replace(/Sauda.?.o/g, 'Greeting');
  text = text.replace(/Seguran.a da Frota & Controle de Or.amento/g, 'Fleet Security & Budget Control');
  text = text.replace(/Limite Di.rio da Frota/g, 'Fleet Daily Limit');
  text = text.replace(/M.tricas \+ Cart.es Virtuais/g, 'Metrics + Virtual Cards');
  text = text.replace(/2 Este m.s/g, '2 This month');
  text = text.replace(/Cart.es Virtuais \(Agent Cards\)/g, 'Virtual Cards (Agent Cards)');
  text = text.replace(/Cart.es de Agentes/g, 'Agent Cards');
  text = text.replace(/Volume Di.rio de Transa.es/g, 'Daily Transaction Volume');
  text = text.replace(/Atividade da sua frota nos .ltimos 7 dias/g, 'Fleet activity in the last 7 days');
  text = text.replace(/Servi.o/g, 'Service');
  text = text.replace(/Gr.fico/g, 'Chart');
  text = text.replace(/COLUNA/g, 'COLUMN');
  text = text.replace(/Transa..es Recentes/g, 'Recent Transactions');
  text = text.replace(/Buscar transa..es/g, 'Search transactions');

  text = text.replace(/Trava de Sa.da/g, 'Withdrawal Lock');
  text = text.replace(/Aprova..o Dupla/g, 'Dual Approval');
  text = text.replace(/Configura..o/g, 'Configuration');
  text = text.replace(/Simula..o/g, 'Simulation');

  text = text.replace(/[\x80-\uFFFF]/g, ''); // Strip ALL remaining non-ascii (mojibake)

  fs.writeFileSync(file, text, 'utf8');
});
console.log('Fixed');
