const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('downloadPDF'));
if (idx !== -1) {
  console.log(lines.slice(Math.max(0, idx-5), idx+5).join('\n'));
} else {
  console.log("NOT FOUND downloadPDF");
}
