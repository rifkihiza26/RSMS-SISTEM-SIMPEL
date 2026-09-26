const fs = require('fs')

function updateCashier() {
  let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')
  content = content.replace(
    /win\.document\.write\(`<html><head><title>Struk - \$\{SHOP_NAME\}<\/title>/,
    `win.document.write(\`<html><head><title>Struk - \${SHOP_NAME}</title>
    <style>@media print { .no-print { display: none !important; } }</style>`
  )
  content = content.replace(
    `win.document.write(el.outerHTML)`,
    `win.document.write('<div class="no-print" style="text-align:center; margin-bottom: 20px; padding: 15px; background: #f3f4f6; font-family: sans-serif;"><button onclick="window.close()" style="padding: 10px 20px; background: #fff; border: 1px solid #ccc; border-radius: 6px; font-weight: bold; margin-right: 10px; cursor: pointer;">Kembali</button><button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Ulang</button></div>')
    win.document.write(el.outerHTML)`
  )
  content = content.replace(
    `setTimeout(() => {\n      win.print()\n      win.close()\n    }, 500)`,
    `setTimeout(() => { win.print() }, 500)`
  )
  fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
}

function updateTransactions() {
  let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')
  content = content.replace(
    /win\.document\.write\('<style>body\{font-family:monospace;/,
    `win.document.write('<style>@media print { .no-print { display: none !important; } } body{font-family:monospace;`
  )
  content = content.replace(
    `win.document.write('</head><body>')\n                  win.document.write(el.outerHTML)`,
    `win.document.write('</head><body>')\n                  win.document.write('<div class="no-print" style="text-align:center; margin-bottom: 20px; padding: 15px; background: #f3f4f6; font-family: sans-serif;"><button onclick="window.close()" style="padding: 10px 20px; background: #fff; border: 1px solid #ccc; border-radius: 6px; font-weight: bold; margin-right: 10px; cursor: pointer;">Kembali</button><button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Ulang</button></div>')\n                  win.document.write(el.outerHTML)`
  )
  content = content.replace(
    `setTimeout(() => { win.print(); win.close() }, 500)`,
    `setTimeout(() => { win.print() }, 500)`
  )
  fs.writeFileSync('src/features/transactions/Transactions.tsx', content)
}

updateCashier()
updateTransactions()
console.log('Patched print window')
