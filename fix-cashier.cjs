const fs = require('fs');
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

// Fix 1: Remove Mechanic import/type if it exists
content = content.replace(/type Mechanic = \{[^}]*\}/g, '');

// Fix 2: Remove references to mechanics inside handleCheckout/printReceipt
content = content.replace(/const mechanicObj = mechanics\.find\(m => m\.id === mechanicId\)/g, 'const mechanicObj = null;');
content = content.replace(/const mechanic_name = mechanicObj \? mechanicObj\.name : '-'/g, "const mechanic_name = '-'");
content = content.replace(/mechanics\.map\(\(m: any\) => \(/g, '[].map((m: any) => (');

// Save
fs.writeFileSync('src/features/cashier/Cashier.tsx', content);
