const fs = require('fs')

// Income.tsx - ubah {isOwner && menjadi {(isOwner || isAdmin) &&
let income = fs.readFileSync('src/features/income/Income.tsx', 'utf8')
income = income.replace(
  `{isOwner && <button onClick={() => { if(confirm('Yakin hapus data ini?')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}`,
  `{(isOwner || isAdmin) && <button onClick={() => { if(confirm('Yakin hapus data ini?')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}`
)
fs.writeFileSync('src/features/income/Income.tsx', income)

// Expenses.tsx - tambah isAdmin ke useAuth dan ubah kondisi tombol hapus
let expenses = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8')
expenses = expenses.replace(
  `const { user, isOwner } = useAuth()`,
  `const { user, isOwner, isAdmin } = useAuth()`
)
expenses = expenses.replace(
  `{isOwner && <button onClick={() => { if(confirm('Yakin hapus pengeluaran ini?')) deleteMutation.mutate(e.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}`,
  `{(isOwner || isAdmin) && <button onClick={() => { if(confirm('Yakin hapus pengeluaran ini?')) deleteMutation.mutate(e.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}`
)
fs.writeFileSync('src/features/expenses/Expenses.tsx', expenses)

console.log('Done!')
