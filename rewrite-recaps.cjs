const fs = require('fs');
let content = fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8');

// Rename the main function
content = content.replace('export function Recaps() {', 'function AdminRecapsForm() {');

// We need to add a new OwnerRecapsList component and a new export function Recaps() at the end.
const additionalCode = `

// ----------------------------------------------------
// OWNER RECAPS LIST (View Only)
// ----------------------------------------------------
function OwnerRecapsList() {
  const { data: allMechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['recaps', 'list'],
    queryFn: async () => {
      // Ambil rekapan 30 hari terakhir
      const { data, error } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanic_id, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) console.error(error)
      return data ?? []
    }
  })

  const recapsWithCalc = recaps.map((tx: any) => {
    const items = tx.transaction_items || []
    const modal = items.reduce((s: number, i: any) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
    const untung = tx.total - modal
    const mechanic = allMechanics.find((m: any) => m.id === tx.mechanic_id)
    return { ...tx, modal, untung, mechanicName: mechanic?.name || '-' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hasil Rekapan Servis</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar rekapan servis, bongkaran, & penjualan parts terbaru.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : recapsWithCalc.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Belum ada rekapan servis</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mekanik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Modal</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Untung</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {recapsWithCalc.map((trx: any) => (
                  <tr key={trx.transaction_number} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">{trx.transaction_number}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{trx.mechanicName}</td>
                    <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{formatRupiah(trx.modal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">{formatRupiah(trx.untung)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupiah(trx.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------
export function Recaps() {
  const { isOwner } = useAuth()
  if (isOwner) return <OwnerRecapsList />
  return <AdminRecapsForm />
}
`;

content += additionalCode;
fs.writeFileSync('src/features/recaps/Recaps.tsx', content);
