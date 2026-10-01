const fs = require('fs');
const content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');
const lines = content.split('\n');
const clicks = [];
lines.forEach((l, i) => { if(l.includes('onClick=')) clicks.push({line: i, code: l}) });
clicks.forEach(c => console.log(c.line + ": " + c.code.trim()));
