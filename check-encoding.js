const fs = require('fs');
const dir = 'C:/Users/jotaf/OneDrive/Desktop/projetos/hackaton/frontend/src/pages';
const files = ['Dashboard.tsx', 'AgentFleet.tsx', 'Simulator.tsx', 'VaultBudgets.tsx'];

files.forEach(file => {
  const text = fs.readFileSync(dir + '/' + file, 'utf8');
  const nonAscii = text.match(/[^\x00-\x7F]/g);
  if (nonAscii) {
    const unique = [...new Set(nonAscii)];
    console.log("File " + file + " has: " + unique.join(''));
  }
});
