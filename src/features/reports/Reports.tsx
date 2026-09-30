import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { downloadPDF } from '@/lib/pdf'
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, FileText, Download, Wrench, Package, ChevronDown, ChevronUp } from 'lucide-react'

type PeriodOption = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'
type ItemFilter = 'semua' | 'jasa' | 'part'

function getDateRange(period: PeriodOption, customFrom: string, customTo: string) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  
  if (period === 'today') {
    const t = fmt(now)
    return { from: t, to: t }
  }
  if (period === 'this_week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const mon = new Date(now.setDate(diff))
    return { from: fmt(mon), to: fmt(new Date()) }
  }
  if (period === 'this_month') {
    return { from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`, to: fmt(now) }
  }
  return { from: customFrom, to: customTo }
}

function isJasaType(item_type: string) {
  return item_type === 'SERVICE' || item_type === 'MANUAL_JASA'
}
function isPartType(item_type: string) {
  return item_type === 'PRODUCT' || item_type === 'MANUAL_BARANG' || item_type === 'MANUAL'
}

export function Reports() {
  const [period, setPeriod] = useState<PeriodOption>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [itemFilter, setItemFilter] = useState<ItemFilter>('semua')
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)

  const { from, to } = getDateRange(period, customFrom, customTo)

  const { data: incomes = [], isLoading: incLoading } = useQuery({
    queryKey: ['report-incomes', from, to],
    enabled: !!(from && to),
    queryFn: async () => {
      const { data } = await supabase
        .from('incomes')
        .select('amount, payment_method, category, date')
        .gte('date', from)
        .lte('date', to)
      return data ?? []
    }
  })

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['report-expenses', from, to],
    enabled: !!(from && to),
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('amount, payment_method, category, date')
        .gte('date', from)
        .lte('date', to)
      return data ?? []
    }
  })

  const { data: transactions = [], isLoading: trxLoading } = useQuery({
    queryKey: ['report-transactions', from, to],
    enabled: !!(from && to),
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('total, payment_method, notes, created_at')
        .gte('created_at', from + 'T00:00:00')
        .lte('created_at', to + 'T23:59:59')
        .in('status', ['COMPLETED', 'PAID'])
      return data ?? []
    }
  })

  const { data: allMechanics = [] } = useQuery({
    queryKey: ['report-mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  // Query transaction_items joined with transactions + mechanics for mechanic report
  const { data: txItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['report-tx-items', from, to],
    enabled: !!(from && to),
    queryFn: async () => {
      const { data } = await supabase
        .from('transaction_items')
        .select(`
          id, item_name, item_type, quantity, unit_price, subtotal,
          transactions!inner(
            id, created_at, motor_type, mechanic_id, status
            
          )
        `)
        .gte('transactions.created_at', from + 'T00:00:00')
        .lte('transactions.created_at', to + 'T23:59:59')
        .in('transactions.status', ['COMPLETED', 'PAID'])
      return data ?? []
    }
  })

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalIncome - totalExpense
  const totalTrx = transactions.length
  const avgTrx = totalTrx > 0 ? transactions.reduce((s, t) => s + t.total, 0) / totalTrx : 0

  // Income by category
  const incByCategory = incomes.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount
    return acc
  }, {} as Record<string, number>)

  // Expense by category
  const expByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  // Payment method breakdown
  const byMethod = transactions.reduce((acc, t) => {
    acc[t.payment_method] = (acc[t.payment_method] || 0) + t.total
    return acc
  }, {} as Record<string, number>)

  // Nota type breakdown
  const byNotaType = transactions.reduce((acc, t) => {
    const isBesar = (t.notes || '').includes('[BESAR]')
    const type = isBesar ? 'Nota Besar' : 'Nota Kecil'
    acc[type] = (acc[type] || 0) + t.total
    return acc
  }, {} as Record<string, number>)

  // Jasa vs Part breakdown from transaction_items
  const totalJasa = txItems
    .filter(i => isJasaType(i.item_type))
    .reduce((s, i) => s + (i.subtotal ?? 0), 0)
  const totalPart = txItems
    .filter(i => isPartType(i.item_type))
    .reduce((s, i) => s + (i.subtotal ?? 0), 0)
  const totalItemAll = totalJasa + totalPart

  // Filter items by itemFilter
  const filteredItems = txItems.filter(i => {
    if (itemFilter === 'jasa') return isJasaType(i.item_type)
    if (itemFilter === 'part') return isPartType(i.item_type)
    return true
  })

  // Group by mechanic for mechanic report
  type MechanicEntry = {
    mechanic_id: string | null
    mechanic_name: string
    items: Array<{
      date: string
      motor: string
      item_name: string
      item_type: string
      quantity: number
      subtotal: number
    }>
    total: number
  }

  const mechanicMap = filteredItems.reduce((acc, i) => {
    const trx = (i as any).transactions
    if (!trx) return acc
    const mechId = trx.mechanic_id ?? 'TANPA_MEKANIK'
    const mechName = allMechanics.find(m => m.id === mechId)?.name ?? '(Tanpa Mekanik)'
    if (!acc[mechId]) {
      acc[mechId] = { mechanic_id: mechId, mechanic_name: mechName, items: [], total: 0 }
    }
    acc[mechId].items.push({
      date: trx.created_at,
      motor: trx.motor_type ?? '-',
      item_name: i.item_name,
      item_type: i.item_type,
      quantity: i.quantity,
      subtotal: i.subtotal ?? 0,
    })
    acc[mechId].total += (i.subtotal ?? 0)
    return acc
  }, {} as Record<string, MechanicEntry>)

  const mechanicList = Object.values(mechanicMap).sort((a, b) => b.total - a.total)

  const isLoading = incLoading || expLoading || trxLoading || itemsLoading

  function printReport() {
    window.print()
  }

  return (
    <div id="report-container" className="space-y-6 bg-gray-50/50 p-2 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-1">Rekapitulasi operasional bengkel</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-2 bg-white border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
          >
            <FileText className="h-4 w-4" /> Cetak
          </button>
          <button
            onClick={() => downloadPDF('report-container', 'Laporan-Rekap-RSMS')}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Periode</label>
          <div className="flex flex-wrap gap-2">
            {(['today', 'this_week', 'this_month', 'this_year', 'custom'] as PeriodOption[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${period === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {p === 'today' ? 'Hari Ini' : p === 'this_week' ? 'Minggu Ini' : p === 'this_month' ? 'Bulan Ini' : p === 'this_year' ? 'Tahun Ini' : 'Kustom'}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dari</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
            <span className="text-gray-400 mt-5">—</span>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sampai</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </div>
          </div>
        )}
        {from && to && (
          <p className="text-xs text-gray-400 self-end pb-1">
            {formatDateShort(from)} — {formatDateShort(to)}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Memuat laporan...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <p className="text-xs text-gray-500 font-medium">Total Pemasukan</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 mt-1 truncate">{formatRupiah(totalIncome)}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0"><TrendingUp className="h-4 w-4 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <p className="text-xs text-gray-500 font-medium">Total Pengeluaran</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600 mt-1 truncate">{formatRupiah(totalExpense)}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg flex-shrink-0"><TrendingDown className="h-4 w-4 text-red-600" /></div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <p className="text-xs text-gray-500 font-medium">Saldo Bersih</p>
                  <p className={`text-lg sm:text-xl font-bold mt-1 truncate ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatRupiah(netProfit)}</p>
                </div>
                <div className={`p-2 rounded-lg flex-shrink-0 ${netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <Wallet className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <p className="text-xs text-gray-500 font-medium">Total Transaksi</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 mt-1">{totalTrx}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">Rata-rata {formatRupiah(Math.round(avgTrx))}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0"><ShoppingCart className="h-4 w-4 text-purple-600" /></div>
              </div>
            </div>
          </div>

          {/* Jasa vs Part Breakdown */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-gray-700">Breakdown Jasa & Part</h2>
              {/* Filter Toggle */}
              <div className="flex gap-1">
                {(['semua', 'jasa', 'part'] as ItemFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setItemFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${itemFilter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {f === 'semua' ? 'Semua' : f === 'jasa' ? '🔧 Jasa' : '📦 Part'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(itemFilter === 'semua' || itemFilter === 'jasa') && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">Total Jasa</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{formatRupiah(totalJasa)}</p>
                  <p className="text-xs text-blue-500 mt-1">
                    {totalItemAll > 0 ? Math.round((totalJasa / totalItemAll) * 100) : 0}% dari total item
                  </p>
                  <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalItemAll > 0 ? (totalJasa / totalItemAll) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
              {(itemFilter === 'semua' || itemFilter === 'part') && (
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-700">Total Part / Barang</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{formatRupiah(totalPart)}</p>
                  <p className="text-xs text-orange-500 mt-1">
                    {totalItemAll > 0 ? Math.round((totalPart / totalItemAll) * 100) : 0}% dari total item
                  </p>
                  <div className="mt-2 h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${totalItemAll > 0 ? (totalPart / totalItemAll) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mechanic Report */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-gray-700">Laporan per Mekanik</h2>
              <div className="flex gap-1">
                {(['semua', 'jasa', 'part'] as ItemFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setItemFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${itemFilter === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {f === 'semua' ? 'Semua' : f === 'jasa' ? '🔧 Jasa' : '📦 Part'}
                  </button>
                ))}
              </div>
            </div>
            {mechanicList.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data mekanik pada periode ini</div>
            ) : (
              <div className="divide-y">
                {mechanicList.map(mech => {
                  const isExpanded = expandedMechanic === mech.mechanic_id
                  return (
                    <div key={mech.mechanic_id}>
                      {/* Mechanic Header Row */}
                      <button
                        onClick={() => setExpandedMechanic(isExpanded ? null : mech.mechanic_id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs">{mech.mechanic_name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{mech.mechanic_name}</p>
                            <p className="text-xs text-gray-400">{mech.items.length} item dikerjakan</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900">{formatRupiah(mech.total)}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-gray-100">
                                <th className="text-left px-4 py-2 font-medium text-gray-600">Tanggal</th>
                                <th className="text-left px-4 py-2 font-medium text-gray-600">Motor</th>
                                <th className="text-left px-4 py-2 font-medium text-gray-600">Item</th>
                                <th className="text-center px-4 py-2 font-medium text-gray-600">Jenis</th>
                                <th className="text-right px-4 py-2 font-medium text-gray-600">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mech.items.map((item, idx) => {
                                const isJasa = isJasaType(item.item_type)
                                return (
                                  <tr key={idx} className="border-b last:border-0 hover:bg-white">
                                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDateShort(item.date)}</td>
                                    <td className="px-4 py-2 text-gray-700 font-medium">{item.motor}</td>
                                    <td className="px-4 py-2 text-gray-800">{item.item_name} {item.quantity > 1 ? `×${item.quantity}` : ''}</td>
                                    <td className="px-4 py-2 text-center">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isJasa ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {isJasa ? 'JASA' : 'PART'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatRupiah(item.subtotal)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-t bg-gray-100">
                                <td colSpan={4} className="px-4 py-2 font-bold text-gray-700 text-right">Total {mech.mechanic_name}:</td>
                                <td className="px-4 py-2 text-right font-bold text-primary">{formatRupiah(mech.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Income Breakdown */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">Pemasukan per Kategori</h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.keys(incByCategory).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Tidak ada data</p>
                ) : Object.entries(incByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600 truncate">{cat}</span>
                      <span className="text-xs font-semibold text-gray-900 ml-2">{formatRupiah(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalIncome > 0 ? (amount / totalIncome) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">Pengeluaran per Kategori</h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.keys(expByCategory).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Tidak ada data</p>
                ) : Object.entries(expByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600 truncate">{cat}</span>
                      <span className="text-xs font-semibold text-gray-900 ml-2">{formatRupiah(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalExpense > 0 ? (amount / totalExpense) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">Penjualan per Metode Bayar</h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.keys(byMethod).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Tidak ada transaksi</p>
                ) : Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                  const colors: Record<string, string> = { CASH: 'bg-green-500', QRIS: 'bg-blue-500', TRANSFER: 'bg-purple-500' }
                  const totalTrxValue = transactions.reduce((s, t) => s + t.total, 0)
                  return (
                    <div key={method}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">{method}</span>
                        <span className="text-xs font-semibold text-gray-900">{formatRupiah(amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[method] ?? 'bg-gray-400'}`} style={{ width: `${totalTrxValue > 0 ? (amount / totalTrxValue) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Nota Type Breakdown */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="text-sm font-semibold text-gray-700">Penjualan per Jenis Nota</h2>
              </div>
              <div className="p-4 space-y-3">
                {Object.keys(byNotaType).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Tidak ada transaksi</p>
                ) : Object.entries(byNotaType).sort((a, b) => b[1] - a[1]).map(([type, amount]) => {
                  const colors: Record<string, string> = { 'Nota Besar': 'bg-orange-500', 'Nota Kecil': 'bg-blue-500' }
                  const totalTrxValue = transactions.reduce((s, t) => s + t.total, 0)
                  return (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">{type}</span>
                        <span className="text-xs font-semibold text-gray-900">{formatRupiah(amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[type] ?? 'bg-gray-400'}`} style={{ width: `${totalTrxValue > 0 ? (amount / totalTrxValue) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Print-only section */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: fixed; left: 0; top: 0; width: 100%; }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
