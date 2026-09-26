const fs = require('fs');
const content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');
// Backup the current cashier file just in case
fs.writeFileSync('src/features/cashier/Cashier.bak.tsx', content);
console.log('Backed up Cashier.tsx');
