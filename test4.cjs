const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('reprint-receipt'));
if (idx !== -1) {
  console.log(lines.slice(idx, idx+15).join('\n'));
} else {
  console.log("NOT FOUND");
}
