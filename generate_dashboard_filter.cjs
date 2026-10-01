const fs = require('fs');

const code = `import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, XCircle, Wallet, FileText, Sheet, Calendar, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'

function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, big = false }: {
  title: string; value: string; icon: React.ElementType; color?: string; subtitle?: string; big?: boolean
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className={\`\${big ? 'text-3xl' : 'text-xl sm:text-2xl'} font-bold text-gray-900 mt-1 truncate\`} title={value}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={\`p-2.5 rounded-lg \${colors[color]} flex-shrink-0 ml-3\`}>
          <Icon className={\`\${big ? 'h-8 w-8' : 'h-5 w-5'}\`} />
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------
// FILTER HOOK & COMPONENT
// ------------------------------------------
type FilterMode = 'MONTH' | 'DAY' | 'RANGE'

function useDashboardFilter() {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const currentMonthStr = todayStr.slice(0, 7)

  const [mode, setMode] = useState<FilterMode>('MONTH')
  const [day, setDay] = useState(todayStr)
  const [month, setMonth] = useState(currentMonthStr)
  const [rangeStart, setRangeStart] = useState(todayStr)
  const [rangeEnd, setRangeEnd] = useState(todayStr)

  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (mode === 'MONTH') {
      const [y, m] = month.split('-')
      const start = \`\${month}-01\`
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
      const end = \`\${month}-\${lastDay}\`
      const label = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      return { startDate: start, endDate: end, periodLabel: \`Bulan \${label}\` }
    }
    if (mode === 'DAY') {
      const label = new Date(day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      return { startDate: day, endDate: day, periodLabel: \`Tanggal \${label}\` }
    }
    // RANGE
    const labelStart = new Date(rangeStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const labelEnd = new Date(rangeEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return { startDate: rangeStart, endDate: rangeEnd, periodLabel: \`\${labelStart} - \${labelEnd}\` }
  }, [mode, day, month, rangeStart, rangeEnd])

  const FilterUI = (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2 text-gray-700 font-medium mr-2">
        <Filter className="w-5 h-5" /> Filter:
      </div>
      <select value={mode} onChange={e => setMode(e.target.value as FilterMode)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
        <option value="MONTH">Bulan</option>
        <option value="DAY">Hari (Spesifik)</option>
        <option value="RANGE">Rentang Bebas</option>
      </select>

      {mode === 'MONTH' && (
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
      )}
      
      {mode === 'DAY' && (
        <input type="date" value={day} onChange={e => setDay(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
      )}

      {mode === 'RANGE' && (
        <div className="flex items-center gap-2">
          <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-500 text-sm">s/d</span>
          <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
      )}
    </div>
  )

  return { startDate, endDate, periodLabel, FilterUI }
}


function useDashboardData(startDate: string, endDate: string, periodLabel: string) {
  const { data: monthItems = [] } = useQuery({
    queryKey: ['dashboard', 'items', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_items').select('item_type, subtotal, quantity, modal_price, created_at')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
      return data ?? []
    }
  })

  const { data: monthExpenses = [] } = useQuery({
    queryKey: ['dashboard', 'expenses', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount, category, date, description')
        .gte('date', startDate)
        .lte('date', endDate)
      return data ?? []
    }
  })

  const totalJasa = monthItems.filter(i => ['SERVICE', 'MANUAL_JASA'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalModalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)

  const totalGaji = monthExpenses.filter(e => e.category === 'Penggajian' || e.category === 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  const totalPengeluaranLain = monthExpenses.filter(e => e.category !== 'Penggajian' && e.category !== 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)

  const profitKotor = totalJasa + (totalBarang - totalModalBarang)
  const profitBersih = profitKotor - (totalGaji + totalPengeluaranLain)

  function downloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(\`
      <html><head><title>Laporan Laba Rugi - \${periodLabel}</title>
      <style>
        body { font-family: sans-serif; padding: 32px; font-size: 13px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { color: #666; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background: #f9fafb; font-weight: bold; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .section { background: #f3f4f6; padding: 8px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; border-left: 4px solid #3b82f6; }
        .laba-row { background: #eff6ff; }
        .rugi-row { background: #fef2f2; }
      </style>
      </head><body>
      <h1>LAPORAN LABA RUGI - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: \${periodLabel}</div>
      
      <div class="section">PEMASUKAN</div>
      <table>
        <tr><td>Pendapatan Jasa Servis</td><td class="right">\${formatRupiah(totalJasa)}</td></tr>
        <tr><td>Pendapatan Barang / Part</td><td class="right">\${formatRupiah(totalBarang)}</td></tr>
        <tr><td class="bold">TOTAL PEMASUKAN</td><td class="right bold">\${formatRupiah(totalJasa + totalBarang)}</td></tr>
      </table>

      <div class="section">HARGA POKOK PENJUALAN (HPP)</div>
      <table>
        <tr><td>Modal Barang Terjual</td><td class="right">\${formatRupiah(totalModalBarang)}</td></tr>
        <tr><td class="bold">ESTIMASI LABA KOTOR</td><td class="right bold">\${formatRupiah(profitKotor)}</td></tr>
      </table>

      <div class="section">PENGELUARAN OPERASIONAL & GAJI</div>
      <table>
        <tr><td>Penggajian Mekanik</td><td class="right">\${formatRupiah(totalGaji)}</td></tr>
        <tr><td>Operasional Lainnya</td><td class="right">\${formatRupiah(totalPengeluaranLain)}</td></tr>
        <tr><td class="bold">TOTAL PENGELUARAN</td><td class="right bold">\${formatRupiah(totalGaji + totalPengeluaranLain)}</td></tr>
      </table>

      <div class="section">RINGKASAN</div>
      <table>
        <tr class="\${profitBersih >= 0 ? 'laba-row' : 'rugi-row'}">
          <td class="bold" style="font-size:16px;">LABA BERSIH</td>
          <td class="right bold" style="font-size:16px;">\${formatRupiah(profitBersih)}</td>
        </tr>
      </table>

      <div style="margin-top:40px; font-size:11px; color:#999;">Dicetak pada: \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new()
    const labaData = [
      ['LAPORAN LABA RUGI - RAKYAT SINTING MATIC SHOP'],
      [\`Periode: \${periodLabel}\`],
      [],
      ['=== PEMASUKAN ==='],
      ['Keterangan', 'Jumlah (Rp)'],
      ['Pendapatan Jasa', totalJasa],
      ['Pendapatan Barang / Part', totalBarang],
      ['TOTAL PEMASUKAN', totalJasa + totalBarang],
      [],
      ['=== HPP & LABA KOTOR ==='],
      ['Modal / HPP Barang', totalModalBarang],
      ['ESTIMASI LABA KOTOR', profitKotor],
      [],
      ['=== PENGELUARAN ==='],
      ['Penggajian Mekanik', totalGaji],
      ['Operasional Bengkel', totalPengeluaranLain],
      ['TOTAL PENGELUARAN', totalGaji + totalPengeluaranLain],
      [],
      ['=== RINGKASAN ==='],
      ['LABA BERSIH', profitBersih],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(labaData)
    ws1['!cols'] = [{ wch: 40 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Laba Rugi')

    const expRows = [
      ['DETAIL PENGELUARAN', 'Kategori', 'Tanggal', 'Jumlah (Rp)'],
      ...monthExpenses.map(e => [e.description || '-', e.category, e.date, e.amount])
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(expRows)
    ws2['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Pengeluaran')

    XLSX.writeFile(wb, \`Laporan-\${periodLabel.replace(/ /g, '-')}.xlsx\`)
  }

  return { totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel }
}

// ------------------------------------------
// OWNER DASHBOARD (Helicopter View)
// ------------------------------------------
function OwnerDashboard() {
  const { startDate, endDate, periodLabel, FilterUI } = useDashboardFilter()
  const { totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitBersih, downloadPDF, downloadExcel } = useDashboardData(startDate, endDate, periodLabel)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Owner</h1>
          <p className="text-sm text-gray-500 mt-1">Laporan Keuangan — {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <Sheet className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {FilterUI}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="TOTAL PENDAPATAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Barang" />
        <StatCard title="TOTAL PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />
      </div>
    </div>
  )
}


// ------------------------------------------
// ADMIN DASHBOARD (Detailed View)
// ------------------------------------------
function AdminDashboard() {
  const { startDate, endDate, periodLabel, FilterUI } = useDashboardFilter()
  const { totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel } = useDashboardData(startDate, endDate, periodLabel)

  const { data: products = [] } = useQuery({
    queryKey: ['dashboard', 'products-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('stock, minimum_stock').eq('status', 'ACTIVE')
      return data ?? []
    }
  })

  const lowStockCount = products.filter(p => p.stock <= p.minimum_stock).length
  const emptyStockCount = products.filter(p => p.stock === 0).length

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['dashboard', 'recent-tx', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('transaction_number, total, payment_method, created_at')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: false }).limit(5)
      return data ?? []
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Utama</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan Bisnis — {periodLabel}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <FileText className="w-4 h-4" /> Laporan PDF
          </button>
          <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <Sheet className="w-4 h-4" /> Laporan Excel
          </button>
        </div>
      </div>

      {FilterUI}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Penjualan" value={formatRupiah(totalBarang)} icon={ShoppingCart} color="blue" subtitle="Barang / Part" />
        <StatCard title="Total Jasa" value={formatRupiah(totalJasa)} icon={TrendingUp} color="green" subtitle="Servis Mekanik" />
        <StatCard title="Pengeluaran Lain" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" subtitle="Operasional" />
        <StatCard title="Laba Kotor" value={formatRupiah(profitKotor)} icon={Wallet} color="purple" subtitle="Sblm Gaji & Ops" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Pergerakan Stok Produk</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-100 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
              <div><p className="text-sm text-red-600 font-medium">Stok Habis</p><p className="text-2xl font-bold text-red-700">{emptyStockCount} Item</p></div>
            </div>
            <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
              <div><p className="text-sm text-orange-600 font-medium">Stok Menipis</p><p className="text-2xl font-bold text-orange-700">{lowStockCount} Item</p></div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h2>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">Belum ada transaksi di periode ini</div>
            ) : (
              <div className="divide-y">
                {recentTransactions.map((trx: any) => (
                  <div key={trx.transaction_number} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div><p className="font-medium text-gray-900 text-sm">{trx.transaction_number}</p><p className="text-xs text-gray-500 mt-1">{formatDateShort(trx.created_at)}</p></div>
                    <div className="text-right"><p className="font-bold text-gray-900">{formatRupiah(trx.total)}</p><span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{trx.payment_method}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------
// KASIR DASHBOARD (Simple View)
// ------------------------------------------
function KasirDashboard() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: todayStats } = useQuery({
    queryKey: ['dashboard', 'kasir', today],
    queryFn: async () => {
      const { data } = await supabase.from('transactions').select('total')
        .gte('created_at', today + 'T00:00:00Z')
      const count = data?.length || 0
      const total = data?.reduce((acc, curr) => acc + curr.total, 0) || 0
      return { count, total }
    }
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Halo, {user?.email?.split('@')[0]}! 👋</h1>
        <p className="text-blue-100">Selamat bekerja, pastikan senyum dan ramah kepada pelanggan.</p>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Performa Kasir Hari Ini</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title="Total Transaksi" value={\`\${todayStats?.count || 0} Nota\`} icon={FileText} color="blue" />
        <StatCard title="Pendapatan Diterima" value={formatRupiah(todayStats?.total || 0)} icon={Wallet} color="green" />
      </div>
    </div>
  )
}

export function Dashboard() {
  const { isAdmin, isOwner } = useAuth()
  if (isOwner) return <OwnerDashboard />
  if (isAdmin) return <AdminDashboard />
  return <KasirDashboard />
}
`

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
