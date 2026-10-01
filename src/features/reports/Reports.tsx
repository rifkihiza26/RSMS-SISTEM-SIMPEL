import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Wallet, FileText,
  Download, Wrench, ShoppingCart, Filter, ChevronDown, ChevronUp
} from 'lucide-react'
import * as XLSX from 'xlsx'

// ---------- HELPERS ----------
type FilterMode = 'MONTH' | 'DAY' | 'RANGE'

function useReportFilter() {
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)

  const [mode, setMode] = useState<FilterMode>('MONTH')
  const [day, setDay] = useState(today)
  const [month, setMonth] = useState(currentMonth)
  const [rangeStart, setRangeStart] = useState(today)
  const [rangeEnd, setRangeEnd] = useState(today)

  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (mode === 'MONTH') {
      const [y, m] = month.split('-')
      const start = `${month}-01`
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
      const end = `${month}-${String(lastDay).padStart(2, '0')}`
      const label = new Date(parseInt(y), parseInt(m) - 1, 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      return { startDate: start, endDate: end, periodLabel: `Bulan ${label}` }
    }
    if (mode === 'DAY') {
      const label = new Date(day + 'T12:00:00').toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
      return { startDate: day, endDate: day, periodLabel: label }
    }
    const labelS = new Date(rangeStart + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const labelE = new Date(rangeEnd + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return { startDate: rangeStart, endDate: rangeEnd, periodLabel: `${labelS} – ${labelE}` }
  }, [mode, day, month, rangeStart, rangeEnd])

  const FilterUI = (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center gap-3">
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
            {m === 'MONTH' ? 'Bulan' : m === 'DAY' ? 'Hari' : 'Rentang'}
          </button>
        ))}
      </div>

      {mode === 'MONTH' && (
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      )}
      {mode === 'DAY' && (
        <input type="date" value={day} onChange={e => setDay(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      )}
      {mode === 'RANGE' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <span className="text-gray-400">s/d</span>
          <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      )}

      <span className="ml-auto text-sm text-gray-500 italic">{periodLabel}</span>
    </div>
  )

  return { startDate, endDate, periodLabel, FilterUI }
}

// Extract motor from notes field (format: "[KECIL] Mekanik: X | Motor: Vario B1234XX | SUMBER: REKAPAN")
function extractMotor(notes: string | null): string {
  if (!notes) return '-'
  const match = notes.match(/Motor:\s*([^|]+)/i)
  return match ? match[1].trim() : '-'
}

function extractMekanik(notes: string | null): string {
  if (!notes) return '-'
  const match = notes.match(/Mekanik:\s*([^|]+)/i)
  return match ? match[1].trim() : '-'
}

function isRekapan(notes: string | null): boolean {
  return !!(notes && notes.includes('REKAPAN'))
}

// ---------- MAIN COMPONENT ----------
export function Reports() {
  const { startDate, endDate, periodLabel, FilterUI } = useReportFilter()
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)

  // Fetch ALL transactions in range (no status filter - rekapan doesn't have status)
  const { data: allTransactions = [], isLoading: trxLoading } = useQuery({
    queryKey: ['reports', 'transactions', startDate, endDate],
    enabled: !!(startDate && endDate),
    queryFn: async () => {
      const { data } = await supabase
        .from('transactions')
        .select('id, transaction_number, total, payment_method, notes, created_at, customer_name, amount_paid, payment_status, mechanic_id')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: true })
      return data ?? []
    }
  })

  // Fetch transaction items for rekapan details
  const { data: allItems = [] } = useQuery({
    queryKey: ['reports', 'items', startDate, endDate],
    enabled: !!(startDate && endDate),
    queryFn: async () => {
      const { data } = await supabase
        .from('transaction_items')
        .select('transaction_id, item_name, item_type, quantity, unit_price, subtotal, modal_price')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
      return data ?? []
    }
  })

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ['reports', 'expenses', startDate, endDate],
    enabled: !!(startDate && endDate),
    queryFn: async () => {
      const { data } = await supabase
        .from('expenses')
        .select('amount, category, date, description')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
      return data ?? []
    }
  })

  // Separate rekapan vs kasir
  const rekapanTrx = allTransactions.filter(t => isRekapan(t.notes))
  const kasirTrx = allTransactions.filter(t => !isRekapan(t.notes))

  // Build item map
  const itemsByTrx = useMemo(() => {
    const map: Record<string, typeof allItems> = {}
    for (const item of allItems) {
      if (!map[item.transaction_id]) map[item.transaction_id] = []
      map[item.transaction_id].push(item)
    }
    return map
  }, [allItems])

  // Aggregate for rekapan
  const rekapanWithDetail = rekapanTrx.map(t => {
    const items = itemsByTrx[t.id] || []
    const jasaItems = items.filter(i => i.item_type === 'MANUAL_JASA')
    const partItems = items.filter(i => i.item_type === 'MANUAL_BARANG')
    const totalJasa = jasaItems.reduce((s, i) => s + (i.subtotal || 0), 0)
    const totalPart = partItems.reduce((s, i) => s + (i.subtotal || 0), 0)
    const totalModal = items.reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
    const totalUntung = t.total - totalModal
    return {
      ...t,
      motor: extractMotor(t.notes),
      mekanik: extractMekanik(t.notes),
      jasaItems, partItems, totalJasa, totalPart, totalModal, totalUntung,
      sisa: t.total - (t.amount_paid || 0)
    }
  })

  // Summary numbers
  const totalRekapan = rekapanTrx.reduce((s, t) => s + t.total, 0)
  const totalKasir = kasirTrx.reduce((s, t) => s + t.total, 0)
  const totalModal = rekapanWithDetail.reduce((s, t) => s + t.totalModal, 0)
  const totalUntung = rekapanWithDetail.reduce((s, t) => s + t.totalUntung, 0)
  const totalJasaAll = rekapanWithDetail.reduce((s, t) => s + t.totalJasa, 0)
  const totalPartAll = rekapanWithDetail.reduce((s, t) => s + t.totalPart, 0)
  const totalPengeluaran = expenses.reduce((s, e) => s + e.amount, 0)
  const labaRekapan = totalUntung + totalKasir - totalPengeluaran
  const totalPiutang = rekapanWithDetail.reduce((s, t) => s + (t.sisa > 0 ? t.sisa : 0), 0)

  // Group rekapan by mechanic
  const byMechanic = useMemo(() => {
    const map: Record<string, { name: string; trx: typeof rekapanWithDetail; total: number }> = {}
    for (const t of rekapanWithDetail) {
      const key = t.mekanik
      if (!map[key]) map[key] = { name: key, trx: [], total: 0 }
      map[key].trx.push(t)
      map[key].total += t.total
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [rekapanWithDetail])

  // Download PDF - Full Detail
  function handleDownloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return

    const rekapanRows = rekapanWithDetail.map(t => `
      <tr>
        <td>${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>${t.customer_name || '-'}</td>
        <td>${t.motor}</td>
        <td>${t.mekanik}</td>
        <td class="right">${formatRupiah(t.totalJasa)}</td>
        <td class="right">${formatRupiah(t.totalPart)}</td>
        <td class="right red">${formatRupiah(t.totalModal)}</td>
        <td class="right green">${formatRupiah(t.totalUntung)}</td>
        <td class="right bold">${formatRupiah(t.total)}</td>
        <td class="center">
          <span class="badge ${t.payment_status === 'LUNAS' ? 'badge-green' : t.payment_status === 'DP' ? 'badge-yellow' : 'badge-red'}">
            ${t.payment_status || 'LUNAS'}
          </span>
        </td>
      </tr>
    `).join('')

    const kasirRows = kasirTrx.map(t => `
      <tr>
        <td>${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${t.transaction_number}</td>
        <td>${t.payment_method || '-'}</td>
        <td class="right bold green">${formatRupiah(t.total)}</td>
      </tr>
    `).join('')

    const expenseRows = expenses.map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>${e.category}</td>
        <td>${e.description || '-'}</td>
        <td class="right bold red">${formatRupiah(e.amount)}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html><head><title>Laporan Servis - ${periodLabel}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 28px; font-size: 12px; color: #111; max-width: 1100px; margin: auto; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 2px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 28px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .sum-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
        .sum-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
        .sum-val { font-size: 16px; font-weight: bold; }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .blue { color: #2563eb; }
        .orange { color: #ea580c; }
        .section { background: #1e293b; color: white; padding: 8px 14px; font-weight: bold; font-size: 13px; margin-top: 24px; border-radius: 6px 6px 0 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 11px; }
        th { background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: 600; color: #374151; }
        td { padding: 7px 8px; border: 1px solid #e2e8f0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef08a; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      </style></head><body>

      <h1>RAKYAT SINTING MATIC SHOP</h1>
      <div class="subtitle">Laporan Rekapan Servis & Keuangan · ${periodLabel}</div>

      <div class="summary-grid">
        <div class="sum-card"><div class="sum-label">Total Servis (Rekapan)</div><div class="sum-val green">${formatRupiah(totalRekapan)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Kasir</div><div class="sum-val blue">${formatRupiah(totalKasir)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Modal Parts</div><div class="sum-val red">${formatRupiah(totalModal)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Pengeluaran</div><div class="sum-val orange">${formatRupiah(totalPengeluaran)}</div></div>
        <div class="sum-card"><div class="sum-label">Jasa Mekanik</div><div class="sum-val green">${formatRupiah(totalJasaAll)}</div></div>
        <div class="sum-card"><div class="sum-label">Penjualan Parts</div><div class="sum-val blue">${formatRupiah(totalPartAll)}</div></div>
        <div class="sum-card"><div class="sum-label">Piutang Belum Lunas</div><div class="sum-val red">${formatRupiah(totalPiutang)}</div></div>
        <div class="sum-card" style="background:#eff6ff; border-color:#93c5fd;"><div class="sum-label">ESTIMASI LABA BERSIH</div><div class="sum-val blue">${formatRupiah(labaRekapan)}</div></div>
      </div>

      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Pelanggan</th><th>Motor / Plat</th><th>Mekanik</th>
          <th class="right">Jasa</th><th class="right">Parts</th>
          <th class="right">Modal</th><th class="right">Untung</th>
          <th class="right">Total</th><th class="center">Status</th>
        </tr></thead>
        <tbody>${rekapanRows || '<tr><td colspan="10" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada rekapan di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">🧾 TRANSAKSI KASIR</div>
      <table>
        <thead><tr><th>Waktu</th><th>No. Nota</th><th>Metode Bayar</th><th class="right">Total</th></tr></thead>
        <tbody>${kasirRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada transaksi kasir di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">💸 DETAIL PENGELUARAN</div>
      <table>
        <thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="right">Nominal</th></tr></thead>
        <tbody>${expenseRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Tidak ada pengeluaran di periode ini</td></tr>'}</tbody>
      </table>

      <div class="footer">Digenerate oleh sistem RSMS · ${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    `)
    win.document.close()
  }

  // Download Excel
  function handleDownloadExcel() {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Summary
    const summaryData = [
      ['LAPORAN REKAPAN SERVIS - RAKYAT SINTING MATIC SHOP'],
      [`Periode: ${periodLabel}`],
      [],
      ['Keterangan', 'Jumlah (Rp)'],
      ['Total Rekapan Servis', totalRekapan],
      ['Total Transaksi Kasir', totalKasir],
      ['Total Modal Parts', totalModal],
      ['Total Pengeluaran', totalPengeluaran],
      ['Estimasi Laba Bersih', labaRekapan],
      ['Piutang Belum Lunas', totalPiutang],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 35 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan')

    // Sheet 2: Rekapan Detail
    const rekapRows = [
      ['Tanggal', 'Pelanggan', 'Motor / Plat', 'Mekanik', 'Total Jasa', 'Total Parts', 'Total Modal', 'Total Untung', 'Total Tagihan', 'Dibayar', 'Sisa Hutang', 'Status'],
      ...rekapanWithDetail.map(t => [
        new Date(t.created_at).toLocaleString('id-ID'),
        t.customer_name || '-',
        t.motor,
        t.mekanik,
        t.totalJasa,
        t.totalPart,
        t.totalModal,
        t.totalUntung,
        t.total,
        t.amount_paid || 0,
        t.sisa > 0 ? t.sisa : 0,
        t.payment_status || 'LUNAS'
      ])
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(rekapRows)
    ws2['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Rekapan Servis')

    // Sheet 3: Kasir
    const kasirRows = [
      ['Waktu', 'No. Nota', 'Metode Bayar', 'Total (Rp)'],
      ...kasirTrx.map(t => [new Date(t.created_at).toLocaleString('id-ID'), t.transaction_number, t.payment_method, t.total])
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(kasirRows)
    ws3['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Transaksi Kasir')

    // Sheet 4: Expenses
    const expRows = [
      ['Tanggal', 'Kategori', 'Keterangan', 'Jumlah (Rp)'],
      ...expenses.map(e => [e.date, e.category, e.description || '-', e.amount])
    ]
    const ws4 = XLSX.utils.aoa_to_sheet(expRows)
    ws4['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 40 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws4, 'Pengeluaran')

    XLSX.writeFile(wb, `Laporan-Servis-${periodLabel.replace(/[\s/]/g, '-')}.xlsx`)
  }

  const isLoading = trxLoading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Servis</h1>
          <p className="text-sm text-gray-500 mt-1">Rekapan servis, kasir, piutang & keuangan bengkel.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleDownloadExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
      </div>

      {FilterUI}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rekapan Servis', value: formatRupiah(totalRekapan), color: 'text-green-600', bg: 'bg-green-50', icon: Wrench },
          { label: 'Transaksi Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', icon: ShoppingCart },
          { label: 'Total Modal Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
          { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', icon: Wallet },
          { label: 'Jasa Mekanik', value: formatRupiah(totalJasaAll), color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
          { label: 'Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-600', bg: 'bg-blue-50', icon: ShoppingCart },
          { label: 'Total Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
          { label: 'Estimasi Laba Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-700' : 'text-red-600', bg: 'bg-blue-50', icon: Wallet },
        ].map(c => (
          <div key={c.label} className={`${c.bg} border rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Rekapan by Mechanic */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" /> Rekapan Servis per Mekanik
        </h2>
        {isLoading ? (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-400">Memuat data...</div>
        ) : byMechanic.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-400">Belum ada rekapan di periode ini</div>
        ) : byMechanic.map(mech => (
          <div key={mech.name} className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedMechanic(expandedMechanic === mech.name ? null : mech.name)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {mech.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{mech.name}</p>
                  <p className="text-xs text-gray-500">{mech.trx.length} nota servis</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-blue-700 text-lg">{formatRupiah(mech.total)}</span>
                {expandedMechanic === mech.name ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {expandedMechanic === mech.name && (
              <div className="border-t overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Tgl</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Pelanggan</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Motor / Plat</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Jasa</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Parts</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Modal</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Untung</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mech.trx.map(t => (
                      <tr key={t.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">{t.customer_name || '-'}</td>
                        <td className="px-4 py-2 text-gray-700">{t.motor}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatRupiah(t.totalJasa)}</td>
                        <td className="px-4 py-2 text-right text-blue-600">{formatRupiah(t.totalPart)}</td>
                        <td className="px-4 py-2 text-right text-red-600">{formatRupiah(t.totalModal)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-green-700">{formatRupiah(t.totalUntung)}</td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">{formatRupiah(t.total)}</td>
                        <td className="px-4 py-2 text-center">
                          {t.payment_status === 'LUNAS' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold border border-green-200">LUNAS</span>
                          ) : t.payment_status === 'DP' ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold border border-yellow-200">DP</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold border border-red-200">BELUM</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kasir Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" /> Transaksi Kasir
        </h2>
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {kasirTrx.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Belum ada transaksi kasir di periode ini</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Waktu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">No. Nota</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Metode Bayar</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {kasirTrx.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.transaction_number}</td>
                    <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{t.payment_method}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expenses */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" /> Pengeluaran
        </h2>
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Belum ada pengeluaran di periode ini</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Keterangan</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">{e.category}</span></td>
                    <td className="px-4 py-3 text-gray-700">{e.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
