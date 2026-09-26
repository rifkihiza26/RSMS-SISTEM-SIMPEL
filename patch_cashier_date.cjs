const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Tambah txDate ke state Cashier
content = content.replace(
  "const [motorType, setMotorType] = useState('')",
  "const [motorType, setMotorType] = useState('')\n  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])"
)

// 2. Reset txDate
content = content.replace(
  "setMotorType('')\n  }",
  "setMotorType('')\n    setTxDate(new Date().toISOString().split('T')[0])\n  }"
)

// 3. Update logika process_transaction (sesudah berhasil)
const updateLogic = `
    if (!error && txDate !== new Date().toISOString().split('T')[0]) {
      const targetTime = txDate + 'T12:00:00Z'
      const { data: trxData } = await supabase.from('transactions').select('id').eq('transaction_number', trxNumber).single()
      if (trxData) {
        await Promise.all([
          supabase.from('transactions').update({ created_at: targetTime }).eq('id', trxData.id),
          supabase.from('transaction_items').update({ created_at: targetTime }).eq('transaction_id', trxData.id),
          supabase.from('incomes').update({ created_at: targetTime, date: txDate }).eq('transaction_id', trxData.id)
        ])
      }
    }
`
content = content.replace(
  `setProcessing(false)\n    if (error)`,
  `${updateLogic}\n    setProcessing(false)\n    if (error)`
)

// 4. Tambah field input Tanggal di UI Kasir (sebelum motor)
content = content.replace(
  `{/* Motor input */}`,
  `{/* Date input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tanggal</span>
            <input
              type="date"
              value={txDate}
              onChange={e => setTxDate(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]"
            />
          </div>

          {/* Motor input */}`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
console.log('Cashier patched')
