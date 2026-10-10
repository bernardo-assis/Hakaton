const fs = require('fs');

const filePaths = [
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Dashboard.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/AgentFleet.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Simulator.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/VaultBudgets.tsx'
];

filePaths.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/Segurana da Frota & Controle de Oramento/g, 'Fleet Security & Budget Control');
  text = text.replace(/Limite Dirio da Frota/g, 'Fleet Daily Limit');
  text = text.replace(/Mtricas \+ Cartes Virtuais/g, 'Metrics + Virtual Cards');
  text = text.replace(/2 Este ms/g, '2 This month');
  text = text.replace(/Cartes de Agentes/g, 'Agent Cards');
  text = text.replace(/Cartes Virtuais/g, 'Virtual Cards');
  text = text.replace(/Oramento dos Cofres/g, 'Vault Budgets');
  text = text.replace(/Consumo nas ltimas 24h/g, '24h Consumption');
  text = text.replace(/Gesto da Frota de Agentes/g, 'Agent Fleet Management');
  text = text.replace(/Transaes hoje/g, 'Transactions today');
  text = text.replace(/Limite Dirio/g, 'Daily Limit');
  text = text.replace(/Funo \/ Propsito/g, 'Purpose');
  text = text.replace(/Chave Pblica Solana/g, 'Solana Public Key');
  text = text.replace(/Limite por Transao/g, 'Per-Transaction Limit');
  text = text.replace(/Rob Comportado/g, 'Well-Behaved Bot');
  text = text.replace(/Rob Descontrolado/g, 'Rogue Bot');
  text = text.replace(/Aguardando incio da simulao/g, 'Waiting to start simulation');
  text = text.replace(/Incio da/g, 'Start of');
  text = text.replace(/incio da/g, 'start of');
  fs.writeFileSync(file, text, 'utf8');
});
