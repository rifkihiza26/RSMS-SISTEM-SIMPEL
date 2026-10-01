const fs = require('fs');
const content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');
const lines = content.split('\n');
const idx1 = lines.findIndex(l => l.includes('function addProduct'));
const idx2 = lines.findIndex(l => l.includes('function addService'));
if (idx1 !== -1) {
  console.log(lines.slice(idx1, idx1+12).join('\n'));
}
if (idx2 !== -1) {
  console.log(lines.slice(idx2, idx2+12).join('\n'));
}
