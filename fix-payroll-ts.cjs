const fs = require('fs');
let content = fs.readFileSync('src/features/payroll/Payroll.tsx', 'utf-8');

// Fix unused imports
content = content.replace(/Users, Search, DollarSign, Printer/g, 'Users, Printer');

// Fix TS errors on item.transactions?.created_at
content = content.replace(
  "item.transactions?.created_at",
  "(item.transactions as any)?.created_at"
);
content = content.replace(
  "item.transactions?.motor_type",
  "(item.transactions as any)?.motor_type"
);

fs.writeFileSync('src/features/payroll/Payroll.tsx', content);
