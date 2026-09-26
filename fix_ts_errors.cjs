const fs = require('fs')

// Fix Expenses.tsx - add delete button manually
let exp = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8')
// Fix: replace -formatRupiah(e.amount) row with delete button
exp = exp.replace(
  `<td className="px-4 py-3 text-right font-semibold text-red-600">{formatRupiah(e.amount)}</td>`,
  `<td className="px-4 py-3 text-right font-semibold text-red-600">-{formatRupiah(e.amount)}</td>
                    <td className="px-4 py-3 text-right">{isOwner && <button onClick={() => { if(confirm('Yakin hapus pengeluaran ini?')) deleteMutation.mutate(e.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}</td>`
)
// Add th header
exp = exp.replace(
  `<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>`,
  `<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>\n                  <th className="px-4 py-3 w-10"></th>`
)
fs.writeFileSync('src/features/expenses/Expenses.tsx', exp)

// Fix Transactions.tsx - add notes to type + remove unused Check
let trx = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')
// 1. add notes field to Transaction type
trx = trx.replace(
  `  profiles?: { full_name: string | null } | null\n}`,
  `  notes?: string | null\n  profiles?: { full_name: string | null } | null\n}`
)
// 2. remove Check from imports
trx = trx.replace(', Check }', ' }')
fs.writeFileSync('src/features/transactions/Transactions.tsx', trx)

// Fix Income.tsx - check if delete button already added
let inc = fs.readFileSync('src/features/income/Income.tsx', 'utf8')
if (!inc.includes('deleteMutation.mutate(i.id)')) {
  inc = inc.replace(
    `<td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(i.amount)}</td>`,
    `<td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(i.amount)}</td>
                    <td className="px-4 py-3 text-right">{isOwner && <button onClick={() => { if(confirm('Yakin hapus pemasukan ini?')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}</td>`
  )
  inc = inc.replace(
    `<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>`,
    `<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>\n                  <th className="px-4 py-3 w-10"></th>`
  )
  fs.writeFileSync('src/features/income/Income.tsx', inc)
}

console.log('Done patching')
