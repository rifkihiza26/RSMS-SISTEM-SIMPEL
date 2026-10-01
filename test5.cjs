const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const idxs = [];
lines.forEach((l, i) => { if(l.includes('id="reprint-receipt"')) idxs.push(i) });
if (idxs.length > 0) {
  console.log(lines.slice(idxs[0]-2, idxs[0]+5).join('\n'));
} else {
  console.log("NOT FOUND");
}
