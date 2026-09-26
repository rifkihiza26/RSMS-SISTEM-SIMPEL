const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Add state for WA
content = content.replace(
  "const [txError, setTxError] = useState('')",
  "const [txError, setTxError] = useState('')\n  const [showWaInput, setShowWaInput] = useState(false)\n  const [waCustomerPhone, setWaCustomerPhone] = useState('')"
)

// Reset WA state on resetTransaction
content = content.replace(
  "setTxDate(new Date().toISOString().split('T')[0])",
  "setTxDate(new Date().toISOString().split('T')[0])\n    setShowWaInput(false)\n    setWaCustomerPhone('')"
)

// Replace WA button with conditional input
const waLogic = `{showWaInput ? (
            <div className="w-full mt-2 bg-gray-50 border rounded-lg p-3 space-y-2">
              <label className="block text-xs font-medium text-gray-700">Nomor WA Customer</label>
              <input type="text" placeholder="Contoh: 08123456789" value={waCustomerPhone} onChange={e => setWaCustomerPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setShowWaInput(false)} className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-100">Batal</button>
                <button onClick={async () => {
                  if (!waCustomerPhone.trim()) return alert('Masukkan nomor WA terlebih dahulu!')
                  await downloadPDF('receipt-pdf', \`Struk-\${completed.transaction_number}\`)
                  shareViaWhatsApp(waCustomerPhone, \`Halo! Berikut struk transaksi \${completed.transaction_number} dari Rakyat Sinting Matic Shop 🏍️\\nTotal: \${formatRupiah(completed.total)}\\nMetode: \${completed.payment_method}\${completed.mechanic_name !== '-' ? \`\\nMekanik: \${completed.mechanic_name}\` : ''}\\n\\nTerima kasih sudah mempercayakan kendaraan Anda kepada kami! 🙏\`)
                  setShowWaInput(false)
                }} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">Kirim WA</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowWaInput(true)}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" /> Kirim via WhatsApp
            </button>
          )}`

// We need to precisely replace the original button
content = content.replace(
  /<button\s+onClick=\{\(\) => shareViaWhatsApp\(undefined, `Halo! Berikut struk transaksi \$\{completed.transaction_number\} dari Rakyat Sinting Matic Shop 🏍️\\nTotal: \$\{formatRupiah\(completed.total\)\}\\nMetode: \$\{completed.payment_method\}\$\{completed.mechanic_name !== '-' \? `\\nMekanik: \$\{completed.mechanic_name\}` : ''\}\\n\\nTerima kasih sudah mempercayakan kendaraan Anda kepada kami! 🙏`\)\}\s+className="w-full mt-2 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700"\s+>\s+<MessageCircle className="h-4 w-4" \/> Kirim via WhatsApp\s+<\/button>/,
  waLogic
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
console.log('WA button patched!')
