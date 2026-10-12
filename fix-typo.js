const fs = require('fs');

const filePaths = [
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Dashboard.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/AgentFleet.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/Simulator.tsx',
  'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages/VaultBudgets.tsx'
];

filePaths.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/Simulationn/g, 'Simulation');
  text = text.replace(/Configurationn/g, 'Configuration');
  text = text.replace(/Transactionn/g, 'Transaction');
  fs.writeFileSync(file, text, 'utf8');
});
