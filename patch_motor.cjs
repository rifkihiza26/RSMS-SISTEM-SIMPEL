const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Tambah motorType ke CompletedTransaction type
content = content.replace(
  '  mechanic_name: string\n}',
  '  mechanic_name: string\n  motor_type: string\n}'
)

// 2. Tambah state motorType
content = content.replace(
  "const [selectedMechanicId, setSelectedMechanicId] = useState('')",
  "const [selectedMechanicId, setSelectedMechanicId] = useState('')\n  const [motorType, setMotorType] = useState('')"
)

// 3. Update p_notes untuk menyertakan motor
content = content.replace(
  "p_notes: selectedMechanicId ? `Mekanik: ${mechanics.find(m => m.id === selectedMechanicId)?.name ?? ''}` : '',",
  `p_notes: [
        selectedMechanicId ? \`Mekanik: \${mechanics.find(m => m.id === selectedMechanicId)?.name ?? ''}\` : '',
        motorType ? \`Motor: \${motorType}\` : ''
      ].filter(Boolean).join(' | ') || '',`
)

// 4. Update setCompleted untuk menyertakan motor_type
content = content.replace(
  "setCompleted({ transaction_number: trxNumber, total, subtotal, discount, payment_method: paymentMethod, change_amount: paymentMethod === 'CASH' ? paid - total : 0, items: cart, mechanic_name: mechName })",
  "setCompleted({ transaction_number: trxNumber, total, subtotal, discount, payment_method: paymentMethod, change_amount: paymentMethod === 'CASH' ? paid - total : 0, items: cart, mechanic_name: mechName, motor_type: motorType })"
)

// 5. Reset motorType saat transaksi baru
content = content.replace(
  "setCompleted(null); setTxError(''); setSelectedMechanicId('')",
  "setCompleted(null); setTxError(''); setSelectedMechanicId(''); setMotorType('')"
)

// 6. Tampilkan motor di struk mini (completed view)
content = content.replace(
  "{completed.mechanic_name !== '-' && <div className=\"flex justify-between\"><span className=\"text-gray-500\">Mekanik</span><span className=\"font-medium\">{completed.mechanic_name}</span></div>}",
  `{completed.motor_type && <div className="flex justify-between"><span className="text-gray-500">Jenis Motor</span><span className="font-medium">{completed.motor_type}</span></div>}
            {completed.mechanic_name !== '-' && <div className="flex justify-between"><span className="text-gray-500">Mekanik</span><span className="font-medium">{completed.mechanic_name}</span></div>}`
)

// 7. Tampilkan motor di struk PDF
content = content.replace(
  "{completed.mechanic_name !== '-' && <div className=\"row\"><span>Mekanik:</span><span className=\"bold\">{completed.mechanic_name}</span></div>}",
  `{completed.motor_type && <div className="row"><span>Motor:</span><span className="bold">{completed.motor_type}</span></div>}
            {completed.mechanic_name !== '-' && <div className="row"><span>Mekanik:</span><span className="bold">{completed.mechanic_name}</span></div>}`
)

// 8. Tambah input motor di UI kasir (sebelum dropdown mekanik)
content = content.replace(
  `{/* Mechanic selector */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Mekanik</span>`,
  `{/* Motor input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Jenis Motor</span>
            <input
              type="text"
              placeholder="Vario 125, Beat, dll..."
              value={motorType}
              onChange={e => setMotorType(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]"
            />
          </div>

          {/* Mechanic selector */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Mekanik</span>`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
console.log('Done!')
