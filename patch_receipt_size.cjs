const fs = require('fs')

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8')
  
  // Ganti ukuran dari 320px menjadi 58mm
  content = content.replace(/width:320px/g, 'width:58mm')
  content = content.replace(/maxWidth:'320px'/g, "maxWidth:'58mm'")
  
  // Kurangi padding agar pas di kertas kecil
  content = content.replace(/padding:'16px'/g, "padding:'4px'")
  content = content.replace(/padding:16px;/g, "padding:4px;")
  
  fs.writeFileSync(filepath, content)
}

patchFile('src/features/cashier/Cashier.tsx')
patchFile('src/features/transactions/Transactions.tsx')

console.log('Receipt size patched to 58mm')
