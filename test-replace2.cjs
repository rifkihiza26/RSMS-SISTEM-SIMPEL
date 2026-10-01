const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('id="reprint-receipt"'));
let brackets = 0;
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i].includes('<div')) brackets += (lines[i].match(/<div/g) || []).length;
  if (lines[i].includes('</div')) brackets -= (lines[i].match(/<\/div/g) || []).length;
  if (brackets === 0 && lines[i].includes('</div')) {
    endIdx = i;
    break;
  }
}
console.log("Start:", startIdx, "End:", endIdx);
console.log(lines[endIdx]);
