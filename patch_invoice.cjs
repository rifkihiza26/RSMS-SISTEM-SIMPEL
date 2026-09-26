const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Update logo CSS - hapus filter grayscale, tampilkan ukuran lebih besar dan cocok dengan logo berwarna gelap
content = content.replace(
  `.logo { width: 80px; height: 80px; object-fit: contain; filter: invert(0); margin: 0 auto 6px; display: block; }`,
  `.logo { width: 140px; height: auto; object-fit: contain; margin: 0 auto 6px; display: block; }`
)

// 2. Hapus badge label dari item di invoice PDF (hidden receipt)
content = content.replace(
  `<div className="row-item-name bold" style={{fontSize:'11px'}}>{i.name}<span className="badge">{i.type}</span></div>`,
  `<div className="row-item-name bold" style={{fontSize:'11px'}}>{i.name}</div>`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)

// Juga hapus badge dari Transactions.tsx (reprint invoice)
let trx = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')

// Hapus badge di reprint receipt
trx = trx.replace(
  /<span className=\{`text-\[10px\].*?item_type.*?`\}>\{item\.item_type\}<\/span>/,
  ''
)
// Perbaiki logo di reprint - hapus grayscale filter
trx = trx.replace(
  `className="h-14 mx-auto mb-2 grayscale"`,
  `className="h-14 mx-auto mb-2"`
)

fs.writeFileSync('src/features/transactions/Transactions.tsx', trx)
console.log('Done!')
