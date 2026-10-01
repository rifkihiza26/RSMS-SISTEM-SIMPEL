const fs = require('fs');
let code = fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8');

// 1. Fix React imports
code = code.replace("import { useState } from 'react'", "import { useState, useMemo } from 'react'");

// 2. We already injected: import { MonthPicker, DayPicker } from '@/components/CalendarPicker'
// Wait, my previous script injected it in a weird place or failed? Let's ensure it's there.
if (!code.includes("import { MonthPicker")) {
  code = code.replace(
    "import { formatRupiah, generateTransactionNumber } from '@/lib/utils'",
    "import { formatRupiah, generateTransactionNumber } from '@/lib/utils'\nimport { MonthPicker, DayPicker } from '@/components/CalendarPicker'\nimport { Filter } from 'lucide-react'"
  );
}

// Check where filteredRecaps went wrong.
// Looks like my previous replace for OwnerReturn failed because I matched the exact old string which might have been modified.
// Let's rewrite OwnerRecapsList completely using a robust replace.

const startIndex = code.indexOf('function OwnerRecapsList() {');
const endIndex = code.indexOf('export function Recaps() {');

if (startIndex > -1 && endIndex > -1) {
  const newOwnerRecapsList = `function OwnerRecapsList() {
  const { startDate, endDate, mechanicFilter, setMechanicFilter, FilterUI } = useRecapsFilter()

  const { data: allMechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['recaps', 'list', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanic_id, customer_name, payment_status, amount_paid, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: false })
      
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

  const filteredRecaps = mechanicFilter === 'ALL' ? recapsWithCalc : recapsWithCalc.filter((r: any) => r.mechanic_id === mechanicFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hasil Rekapan Servis</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan dari kasir dan mekanik</p>
      </div>
      
      {FilterUI}
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Filter Mekanik:</span>
        <select 
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          value={mechanicFilter} 
          onChange={e => setMechanicFilter(e.target.value)}
        >
          <option value="ALL">Semua Mekanik</option>
          {allMechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : filteredRecaps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada hasil rekapan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Mekanik</th>
                  <th className="px-4 py-3 text-right">Modal Parts</th>
                  <th className="px-4 py-3 text-right">Untung</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3 text-right">Sisa Hutang</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecaps.map((trx: any) => {
                  const sisa = trx.total - (trx.amount_paid || 0)
                  return (
                    <tr key={trx.transaction_number} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{trx.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{trx.mechanicName}</td>
                      <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{formatRupiah(trx.modal)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">{formatRupiah(trx.untung)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupiah(trx.total)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">{sisa > 0 ? formatRupiah(sisa) : 'Rp0'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {trx.payment_status === 'LUNAS' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">LUNAS</span>
                        ) : trx.payment_status === 'DP' ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">DP</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">BELUM BAYAR</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------
`;

  code = code.substring(0, startIndex) + newOwnerRecapsList + code.substring(endIndex);
  fs.writeFileSync('src/features/recaps/Recaps.tsx', code);
  console.log('Successfully replaced OwnerRecapsList');
} else {
  console.log('Could not find OwnerRecapsList boundaries');
}
