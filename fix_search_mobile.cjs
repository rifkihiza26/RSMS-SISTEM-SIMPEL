const fs = require('fs')
const files = [
  'src/features/income/Income.tsx',
  'src/features/expenses/Expenses.tsx',
  'src/features/transactions/Transactions.tsx',
  'src/features/products/Products.tsx',
  'src/features/mechanics/Mechanics.tsx',
  'src/features/services/Services.tsx',
  'src/features/inventory/Inventory.tsx',
  'src/features/restocks/Restocks.tsx',
]

for (const f of files) {
  try {
    let content = fs.readFileSync(f, 'utf8')

    // Fix outer filter bar wrapper - tambahkan w-full
    content = content.replace(
      /className="flex flex-wrap gap-3"/g,
      'className="flex flex-wrap gap-2 w-full"'
    )

    // Fix filter bar inside white card
    content = content.replace(
      /className="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-3"/g,
      'className="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-2 w-full"'
    )

    // Fix search wrapper div - pastikan bisa shrink dan min-w-0
    content = content.replace(
      /className="flex items-center gap-2 flex-1 min-w-\[200px\] bg-white border rounded-lg px-3 py-2 shadow-sm"/g,
      'className="flex items-center gap-2 flex-1 min-w-0 bg-white border rounded-lg px-3 py-2 shadow-sm overflow-hidden"'
    )
    content = content.replace(
      /className="flex items-center gap-2 flex-1 min-w-48 border rounded-lg px-3 py-2"/g,
      'className="flex items-center gap-2 flex-1 min-w-0 border rounded-lg px-3 py-2 overflow-hidden"'
    )

    // Fix input inside search - tambah min-w-0 dan truncate placeholder
    content = content.replace(
      /className="flex-1 text-sm outline-none bg-transparent"/g,
      'className="flex-1 text-sm outline-none bg-transparent min-w-0 w-full"'
    )
    content = content.replace(
      /className="flex-1 text-sm outline-none"/g,
      'className="flex-1 text-sm outline-none min-w-0 w-full"'
    )

    fs.writeFileSync(f, content)
    console.log('Fixed:', f)
  } catch(e) {
    console.log('Skip:', f, e.message)
  }
}
