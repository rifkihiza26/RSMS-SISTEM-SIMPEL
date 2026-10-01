import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Users, Printer } from 'lucide-react'

export function Payroll() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedMechanic, setSelectedMechanic] = useState<string>('')

  // Gaji configs
  const [percentage, setPercentage] = useState('40') // Default bagi hasil 40%
  const [uangMakan, setUangMakan] = useState('0')

  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics-active'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id,name').order('name')
      return data ?? []
    }
  })

  // Get all transaction items for this mechanic in the date range
  const { data: txItems = [], isLoading } = useQuery({
    queryKey: ['payroll-tx', selectedMechanic, dateFrom, dateTo],
    enabled: !!(selectedMechanic && dateFrom && dateTo),
    queryFn: async () => {
      const { data } = await supabase
        .from('transaction_items')
        .select(`
          id, item_name, item_type, subtotal,
          transactions!inner( id, created_at, mechanic_id, motor_type, transaction_number )
        `)
        .eq('transactions.mechanic_id', selectedMechanic)
        .gte('transactions.created_at', dateFrom + 'T00:00:00')
        .lte('transactions.created_at', dateTo + 'T23:59:59')
        .in('item_type', ['SERVICE', 'MANUAL_JASA']) // Hanya Jasa
      
      return data ?? []
    }
  })

  const totalJasaKotor = txItems.reduce((s, i) => s + (i.subtotal || 0), 0)
  const persen = parseFloat(percentage) || 0
  const totalBagiHasil = (totalJasaKotor * persen) / 100
  const tambahanUangMakan = parseFloat(uangMakan) || 0
  const totalGajiBersih = totalBagiHasil + tambahanUangMakan

  const handlePrint = () => {
    const mechName = mechanics.find(m => m.id === selectedMechanic)?.name
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Slip Gaji - ${mechName}</title>
      <style>
        body { font-family: sans-serif; padding: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
      </style>
      </head><body>
      <h2>Slip Gaji Mekanik</h2>
      <p><strong>Nama:</strong> ${mechName}</p>
      <p><strong>Periode:</strong> ${dateFrom} s/d ${dateTo}</p>
      <hr />
      <p><strong>Total Omset Jasa:</strong> ${formatRupiah(totalJasaKotor)}</p>
      <p><strong>Bagi Hasil Jasa (${percentage}%):</strong> ${formatRupiah(totalBagiHasil)}</p>
      <p><strong>Uang Makan / Bonus:</strong> ${formatRupiah(tambahanUangMakan)}</p>
      <hr />
      <h3><strong>Total Gaji Dibayarkan: ${formatRupiah(totalGajiBersih)}</strong></h3>
      <br/><br/>
      <div style="display:flex; justify-content:space-between; margin-top:50px;">
        <div style="text-align:center;">Diterima Oleh,<br/><br/><br/><br/>( ${mechName} )</div>
        <div style="text-align:center;">Disetujui Oleh,<br/><br/><br/><br/>( Manajemen Bengkel )</div>
      </div>
      <script>window.print();</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penggajian Mekanik</h1>
          <p className="text-sm text-gray-500 mt-1">Hitung gaji berdasarkan bagi hasil jasa & uang makan.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Filter & Config */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Filter Periode</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Pilih Mekanik</label>
                <select value={selectedMechanic} onChange={e => setSelectedMechanic(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50">
                  <option value="">-- Pilih Mekanik --</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Pengaturan Gaji</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bagi Hasil Jasa (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={percentage} onChange={e => setPercentage(e.target.value)} className="w-full border rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-primary/50" />
                  <span className="absolute right-3 top-2.5 text-gray-400 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Uang Makan / Lainnya (Rp)</label>
                <input type="text" value={formatCurrencyInput(uangMakan)} onChange={e => setUangMakan(parseCurrencyInput(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Calculation Result */}
        <div className="flex-1 bg-white p-5 rounded-xl border shadow-sm flex flex-col h-[calc(100vh-140px)]">
          {!selectedMechanic ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Users className="h-12 w-12 mb-3 text-gray-300" />
              <p>Pilih mekanik di samping untuk melihat rincian gaji</p>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-gray-500 animate-pulse">Menghitung...</p></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 uppercase">Total Omset Jasa</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatRupiah(totalJasaKotor)}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-600 uppercase">Jatah Bagi Hasil ({percentage}%)</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{formatRupiah(totalBagiHasil)}</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-orange-600 uppercase">Total Gaji + Makan</p>
                  <p className="text-2xl font-black text-orange-600 mt-1">{formatRupiah(totalGajiBersih)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="font-bold text-gray-800">Rincian Jasa Dikerjakan ({txItems.length} item)</h3>
                <button onClick={handlePrint} className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Printer className="w-4 h-4" /> Cetak Slip
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium text-gray-500">Tanggal</th>
                      <th className="px-4 py-2 font-medium text-gray-500">Motor</th>
                      <th className="px-4 py-2 font-medium text-gray-500">Pekerjaan</th>
                      <th className="px-4 py-2 font-medium text-gray-500 text-right">Ongkos (Kotor)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {txItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {new Date((item.transactions as any)?.created_at || '').toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-2 font-medium">{(item.transactions as any)?.motor_type || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">{item.item_name}</td>
                        <td className="px-4 py-2 text-right font-semibold">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                    {txItems.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-6 text-gray-400">Tidak ada jasa dikerjakan pada periode ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
