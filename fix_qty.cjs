const fs = require('fs');
let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

code = code.replace(
  /const qty = parseInt\(manualForm\.qty\)/g,
  "const qty = manualForm.type === 'Jasa' ? 1 : parseInt(manualForm.qty)"
);

fs.writeFileSync('src/features/cashier/Cashier.tsx', code);
