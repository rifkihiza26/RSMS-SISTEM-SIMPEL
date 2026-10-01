const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');
content = content.replace(/type Mechanic = \{ id: string; name: string \}\n/g, '');
content = content.replace(/const mechanicName = ''\n/g, '');
fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
