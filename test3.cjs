const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const idxs = [];
lines.forEach((l, i) => { if(l.includes('downloadPDF')) idxs.push(i) });
idxs.forEach(idx => {
  console.log(lines.slice(idx-2, idx+3).join('\n'));
  console.log('---');
});
