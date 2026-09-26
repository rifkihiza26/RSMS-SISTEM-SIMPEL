const fs = require('fs')

function patchPrint(filepath) {
  let content = fs.readFileSync(filepath, 'utf8')
  
  // Replace @page { margin: 0; } with @page { size: 58mm auto; margin: 0; }
  content = content.replace(/@page \{ margin: 0; \}/g, '@page { size: 58mm auto; margin: 0; }')
  
  fs.writeFileSync(filepath, content)
}

patchPrint('src/features/cashier/Cashier.tsx')
patchPrint('src/features/transactions/Transactions.tsx')

console.log('Page size CSS patched')
