const fs = require('fs')
let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')
// Wait, is there a hidden class issue?
// In Cashier, className="hidden"
// In Transactions, className="hidden"
