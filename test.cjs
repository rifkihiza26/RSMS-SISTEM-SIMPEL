const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('receipt-pdf'));
if (idx !== -1) {
  console.log(lines.slice(idx, idx+10).join('\n'));
} else {
  console.log("NOT FOUND");
}
