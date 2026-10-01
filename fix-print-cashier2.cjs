const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

const target1 = `    iframe.style.width = '58mm'`;
const replace1 = `    iframe.style.width = notaType === 'BESAR' ? '148mm' : '58mm'`;

content = content.replace(target1, replace1);
fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
console.log('Replaced width');
