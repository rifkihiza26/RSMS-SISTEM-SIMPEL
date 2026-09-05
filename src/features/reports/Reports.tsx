import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { downloadPDF } from '@/lib/pdf'
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, FileText, Download } from 'lucide-react'

type PeriodOption = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'

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

export function Reports() {
  const [period, setPeriod] = useState<PeriodOption>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

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
        .select('total, payment_method, created_at')
        .gte('created_at', from + 'T00:00:00')
        .lte('created_at', to + 'T23:59:59')
        .eq('status', 'COMPLETED')
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

  const isLoading = incLoading || expLoading || trxLoading

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
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Pemasukan</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{formatRupiah(totalIncome)}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="h-4 w-4 text-green-600" /></div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Pengeluaran</p>
                  <p className="text-xl font-bold text-red-600 mt-1">{formatRupiah(totalExpense)}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg"><TrendingDown className="h-4 w-4 text-red-600" /></div>
              </div>
            </div>
            <div className={`bg-white border rounded-xl p-4 shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Saldo Bersih</p>
                  <p className={`text-xl font-bold mt-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatRupiah(netProfit)}</p>
                </div>
                <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
                  <Wallet className={`h-4 w-4 ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Transaksi</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{totalTrx}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Rata-rata {formatRupiah(Math.round(avgTrx))}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg"><ShoppingCart className="h-4 w-4 text-purple-600" /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${totalIncome > 0 ? (amount / totalIncome) * 100 : 0}%` }}
                      />
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
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${totalExpense > 0 ? (amount / totalExpense) * 100 : 0}%` }}
                      />
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
                        <div
                          className={`h-full rounded-full ${colors[method] ?? 'bg-gray-400'}`}
                          style={{ width: `${totalTrxValue > 0 ? (amount / totalTrxValue) * 100 : 0}%` }}
                        />
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
