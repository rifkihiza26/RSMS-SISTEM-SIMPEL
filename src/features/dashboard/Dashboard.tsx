import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, ShoppingCart, AlertTriangle, XCircle, Wallet, FileText, Sheet, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'
import { MonthPicker, DayPicker } from '@/components/CalendarPicker'

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
          <p className={`${big ? 'text-3xl' : 'text-xl sm:text-2xl'} font-bold text-gray-900 mt-1 truncate`} title={value}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colors[color]} flex-shrink-0 ml-3`}>
          <Icon className={`${big ? 'h-8 w-8' : 'h-5 w-5'}`} />
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
      const start = `${month}-01`
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
      const end = `${month}-${String(lastDay).padStart(2, '0')}`
      const label = new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      return { startDate: start, endDate: end, periodLabel: `Bulan ${label}` }
    }
    if (mode === 'DAY') {
      const label = new Date(day + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      return { startDate: day, endDate: day, periodLabel: label }
    }
    const labelStart = new Date(rangeStart + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const labelEnd = new Date(rangeEnd + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return { startDate: rangeStart, endDate: rangeEnd, periodLabel: `${labelStart} – ${labelEnd}` }
  }, [mode, day, month, rangeStart, rangeEnd])

  const FilterUI = (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-gray-700 font-semibold">
        <Filter className="w-4 h-4" /> Filter Periode:
      </div>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {(['MONTH', 'DAY', 'RANGE'] as FilterMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {m === 'MONTH' ? '📅 Bulan' : m === 'DAY' ? '📆 Hari' : '📊 Rentang'}
          </button>
        ))}
      </div>

      {mode === 'MONTH' && (
        <MonthPicker value={month} onChange={setMonth} />
      )}
      {mode === 'DAY' && (
        <DayPicker value={day} onChange={setDay} />
      )}
      {mode === 'RANGE' && (
        <div className="flex items-center gap-2 flex-wrap">
          <DayPicker value={rangeStart} onChange={setRangeStart} label="Dari" />
          <span className="text-gray-400 font-medium">→</span>
          <DayPicker value={rangeEnd} onChange={setRangeEnd} label="Sampai" />
        </div>
      )}

      <span className="ml-auto text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">{periodLabel}</span>
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
        .order('date', { ascending: true })
      return data ?? []
    }
  })
  
  const { data: detailTransactions = [] } = useQuery({
    queryKey: ['dashboard', 'detail-tx', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('transaction_number, total, created_at, notes, payment_method, customer_name')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: true })
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

    const incomeRows = detailTransactions.map(tx => `
      <tr>
        <td>${new Date(tx.created_at).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
        <td>${tx.transaction_number}</td>
        <td>${tx.customer_name || '-'}</td>
        <td>${tx.notes || 'Transaksi Kasir'}</td>
        <td class="right text-green bold">${formatRupiah(tx.total)}</td>
      </tr>
    `).join('');

    const expenseRows = monthExpenses.map(ex => `
      <tr>
        <td>${new Date(ex.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
        <td>${ex.category}</td>
        <td>${ex.description || '-'}</td>
        <td class="right text-red bold">${formatRupiah(ex.amount)}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html><head><title>Buku Kas / Laporan - ${periodLabel}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; font-size: 12px; color: #111; max-width: 1000px; margin: auto; }
        h1 { font-size: 20px; margin-bottom: 4px; text-align: center; }
        .sub { color: #666; margin-bottom: 30px; font-size: 13px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
        th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f4f4f5; font-weight: bold; color: #333; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .section { background: #1f2937; color: white; padding: 10px; font-weight: bold; margin-top: 30px; margin-bottom: 0px; font-size: 14px; }
        .summary-box { border: 2px solid #1f2937; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
        .summary-grid { display: flex; justify-content: space-between; }
        .sum-col { width: 48%; }
        .sum-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; }
        .sum-row.total { border-bottom: none; font-weight: bold; font-size: 14px; border-top: 2px solid #ccc; margin-top: 4px; padding-top: 8px; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
      </style>
      </head><body>
      
      <h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: ${periodLabel}</div>
      
      <div class="summary-box">
        <h2 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Ringkasan Laba Rugi</h2>
        <div class="summary-grid">
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PEMASUKAN (INCOME)</div>
            <div class="sum-row"><span>Total Pendapatan Jasa:</span> <span class="text-green">${formatRupiah(totalJasa)}</span></div>
            <div class="sum-row"><span>Total Penjualan Parts:</span> <span class="text-green">${formatRupiah(totalBarang)}</span></div>
            <div class="sum-row total"><span>TOTAL KOTOR:</span> <span class="text-green">${formatRupiah(totalJasa + totalBarang)}</span></div>
            <br/>
            <div class="sum-row"><span>Harga Pokok / Modal Parts:</span> <span class="text-red">-${formatRupiah(totalModalBarang)}</span></div>
            <div class="sum-row total"><span>ESTIMASI LABA KOTOR:</span> <span class="text-blue">${formatRupiah(profitKotor)}</span></div>
          </div>
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PENGELUARAN (OUTCOME)</div>
            <div class="sum-row"><span>Gaji Mekanik & Karyawan:</span> <span class="text-red">${formatRupiah(totalGaji)}</span></div>
            <div class="sum-row"><span>Operasional & Lainnya:</span> <span class="text-red">${formatRupiah(totalPengeluaranLain)}</span></div>
            <div class="sum-row total"><span>TOTAL PENGELUARAN:</span> <span class="text-red">${formatRupiah(totalGaji + totalPengeluaranLain)}</span></div>
            <br/>
            <div class="sum-row total" style="font-size: 18px; border-top: 3px solid #111;">
              <span>LABA BERSIH:</span> 
              <span class="${profitBersih >= 0 ? 'text-green' : 'text-red'}">${formatRupiah(profitBersih)}</span>
            </div>
          </div>
        </div>
      </div>

      ${detailTransactions.length > 0 ? `
      <div class="section">DETAIL TRANSAKSI PEMASUKAN (INCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">No. Trx</th>
            <th width="20%">Pelanggan</th>
            <th width="30%">Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${incomeRows}
        </tbody>
      </table>` : ''}

      ${monthExpenses.length > 0 ? `
      <div class="section">DETAIL PENGELUARAN (OUTCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">Kategori</th>
            <th width="50%">Deskripsi / Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${expenseRows}
        </tbody>
      </table>` : ''}

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada ${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    `)
    win.document.close()
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Ringkasan
    const labaData = [
      ['HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP'],
      [`Periode: ${periodLabel}`],
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
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Laba Rugi')

    // Sheet 2: Transaksi Detail
    const incRows = [
      ['DETAIL PEMASUKAN', 'No. Trx', 'Pelanggan', 'Keterangan', 'Jumlah (Rp)'],
      ...detailTransactions.map(t => [new Date(t.created_at).toLocaleString('id-ID'), t.transaction_number, t.customer_name || '-', t.notes || 'Kasir', t.total])
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(incRows)
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Pemasukan')

    // Sheet 3: Pengeluaran Detail
    const expRows = [
      ['DETAIL PENGELUARAN', 'Kategori', 'Tanggal', 'Jumlah (Rp)'],
      ...monthExpenses.map(e => [e.description || '-', e.category, e.date, e.amount])
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(expRows)
    ws3['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Detail Pengeluaran')

    XLSX.writeFile(wb, `Rekapan-${periodLabel.replace(/ /g, '-')}.xlsx`)
  }

  return { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel }
}
// ------------------------------------------
// OWNER DASHBOARD (Helicopter View)
// ------------------------------------------
function OwnerDashboard() {
  const { startDate, endDate, periodLabel, FilterUI } = useDashboardFilter()
  const { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitBersih, downloadPDF, downloadExcel } = useDashboardData(startDate, endDate, periodLabel)

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Parts Kasir" />
        <StatCard title="UNTUNG PARTS" value={formatRupiah(totalBarang - totalModalBarang)} icon={TrendingUp} color="blue" big subtitle="Dari HPP Parts" />
        <StatCard title="PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
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
  const { totalJasa, totalBarang, totalPengeluaranLain, profitKotor, downloadPDF, downloadExcel } = useDashboardData(startDate, endDate, periodLabel)

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
        <StatCard title="Total Transaksi" value={`${todayStats?.count || 0} Nota`} icon={FileText} color="blue" />
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
