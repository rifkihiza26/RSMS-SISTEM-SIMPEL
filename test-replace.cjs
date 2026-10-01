const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');
const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('id="reprint-receipt"'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('</div>') && lines[i+1] && lines[i+1].includes('</div>') && lines[i+2] && lines[i+2].includes('}'));
console.log("Start:", startIdx, "End:", endIdx);
