const fs = require('fs')

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8')
  // Mengubah img src="/logo.png" menjadi img src="/logo-struk.jpg"
  content = content.replace(
    /<img src="\/logo\.png"/g,
    '<img src="/logo-struk.jpg"'
  )
  fs.writeFileSync(filepath, content)
}

patchFile('src/features/cashier/Cashier.tsx')
patchFile('src/features/transactions/Transactions.tsx')

console.log('Logo patched')
