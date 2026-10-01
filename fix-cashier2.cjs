const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

content = content.replace(/const mechanicName = mechanics\.find\(m => m\.id === selectedMechanicId\)\?\.name \|\| ''/g, `const mechanicName = '-'`);
content = content.replace(/const mechName = mechanics\.find\(m => m\.id === selectedMechanicId\)\?\.name \?\? '-'/g, `const mechName = '-'`);
content = content.replace(/mechanics\.map\(\(m: any\) => \(/g, `[].map((m: any) => (`);

fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
