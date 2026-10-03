import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils'
import {
  TrendingDown, FileText,
  Download, Wrench, ShoppingCart, Filter, ChevronDown, ChevronUp
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { MonthPicker, DayPicker } from '@/components/CalendarPicker'

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

// Extract motor from notes field (format: "[KECIL] Mekanik: X | Motor: Vario B1234XX | SUMBER: REKAPAN")
function extractMotor(notes: string | null): string {
  if (!notes) return '-'
  const match = notes.match(/Motor:\s*([^|]+)/i)
  return match ? match[1].trim() : '-'
}

function extractMekanik(notes: string | null): string {
  if (!notes) return 'Kasir'
  const match = notes.match(/Mekanik:\s*([^|]+)/i)
  const name = match ? match[1].trim() : ''
  return name || 'Kasir'
}

function isRekapan(notes: string | null): boolean {
  return !!(notes && notes.includes('REKAPAN'))
}

// ---------- MAIN COMPONENT ----------
export function Reports() {
  const { startDate, endDate, periodLabel, FilterUI } = useReportFilter()
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState('ALL')

  const { data: mechanics = [] } = useQuery({
    queryKey: ['reports', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('name')
      return data?.map(m => m.name) ?? []
    }
  })

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
  let rekapanWithDetail = rekapanTrx.map(t => {
    const items = itemsByTrx[t.id] || []
    const jasaItems = items.filter(i => i.item_type === 'MANUAL_JASA')
    const partItems = items.filter(i => i.item_type === 'MANUAL_BARANG')
    const totalJasa = jasaItems.reduce((s, i) => s + (i.subtotal || 0), 0)
    const totalPart = partItems.reduce((s, i) => s + (i.subtotal || 0), 0)
    const totalModal = items.reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
    const totalUntung = totalPart - totalModal
    return {
      ...t,
      motor: extractMotor(t.notes),
      mekanik: extractMekanik(t.notes),
      jasaItems, partItems, totalJasa, totalPart, totalModal, totalUntung,
      sisa: t.total - (t.amount_paid || 0)
    }
  })

  if (mechanicFilter !== 'ALL') {
    rekapanWithDetail = rekapanWithDetail.filter(r => r.mekanik.toLowerCase() === mechanicFilter.toLowerCase())
  }

  // Summary numbers
  const totalRekapan = rekapanWithDetail.reduce((s, t) => s + t.total, 0)
  const totalKasir = kasirTrx.reduce((s, t) => s + t.total, 0)
  const totalModal = rekapanWithDetail.reduce((s, t) => s + t.totalModal, 0)
  
  const totalJasaAll = rekapanWithDetail.reduce((s, t) => s + t.totalJasa, 0)
  const totalPartAll = rekapanWithDetail.reduce((s, t) => s + t.totalPart, 0)
  const isBelanja = (cat: string) => cat && cat.toLowerCase().includes('belanja') && (cat.toLowerCase().includes('part') || cat.toLowerCase().includes('stok'));
  const pengeluaranBelanjaParts = expenses.filter(e => isBelanja(e.category)).reduce((s, e) => s + e.amount, 0);
  const pengeluaranOperasional = expenses.filter(e => !isBelanja(e.category)).reduce((s, e) => s + e.amount, 0);
  
  const totalPengeluaran = pengeluaranOperasional; // Use this variable name for existing UI (so it means Operasional only)
  
  const untungParts = totalPartAll - totalModal
  const hakMekanik = totalJasaAll * 0.5   // 50% jasa adalah hak mekanik
  const jasaBengkel = totalJasaAll * 0.5  // 50% jasa adalah hak bengkel
  const totalPemasukanKotor = totalJasaAll + totalPartAll + totalKasir
  // Bersih = jatah jasa bengkel (50%) + untung parts + kasir - pengeluaran ops
  const labaRekapan = jasaBengkel + untungParts + totalKasir - pengeluaranOperasional
  const totalPiutang = rekapanWithDetail.reduce((s, t) => s + (t.sisa > 0 ? t.sisa : 0), 0)

  // Group rekapan by mechanic
  const byMechanic = useMemo(() => {
    const map: Record<string, { name: string; trx: typeof rekapanWithDetail; total: number; totalJasa: number; totalUntungParts: number }> = {}
    for (const t of rekapanWithDetail) {
      const key = t.mekanik
      if (!map[key]) map[key] = { name: key, trx: [], total: 0, totalJasa: 0, totalUntungParts: 0 }
      map[key].trx.push(t)
      map[key].total += t.total
      map[key].totalJasa += t.totalJasa
      map[key].totalUntungParts += t.totalUntung
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
        <td class="right red">-${formatRupiah(t.totalModal)}</td>
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

    const expenseOpsRows = expenses.filter(e => !isBelanja(e.category)).map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>${e.category}</td>
        <td>${e.description || '-'}</td>
        <td class="right bold red">-${formatRupiah(e.amount)}</td>
      </tr>
    `).join('')

    const expenseBelanjaRows = expenses.filter(e => isBelanja(e.category)).map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>${e.category}</td>
        <td>${e.description || '-'}</td>
        <td class="right bold" style="color:#ea580c">${formatRupiah(e.amount)}</td>
      </tr>
    `).join('')

    const piutangRows = rekapanWithDetail.filter(t => t.sisa > 0).map(t => `
      <tr>
        <td>${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>${t.customer_name || '-'}</td>
        <td>${t.motor}</td>
        <td>${t.mekanik}</td>
        <td class="right">${formatRupiah(t.total)}</td>
        <td class="right green">${formatRupiah(t.amount_paid || 0)}</td>
        <td class="right bold red">${formatRupiah(t.sisa)}</td>
        <td class="center"><span class="badge badge-yellow">${t.payment_status || 'DP'}</span></td>
      </tr>
    `).join('')

    

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
        .sum-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; font-size: 13px; }
        .sum-row.total { border-bottom: none; font-weight: bold; font-size: 14px; border-top: 2px solid #ccc; margin-top: 4px; padding-top: 8px; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef08a; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
      </style>
      </head><body>
      
      <h1>${mechanicFilter === 'ALL' ? 'HASIL REKAPAN & BUKU KAS' : 'LAPORAN KINERJA MEKANIK'} - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: ${periodLabel}</div>
      
      ${mechanicFilter === 'ALL' ? `<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Pendapatan</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:4px 0 4px 16px; color:#888; font-style:italic; font-size:12px;">— Hak Mekanik (50% Jasa)</td><td style="text-align:right; color:#dc2626; font-weight:bold; font-size:12px;">-${formatRupiah(hakMekanik)}</td></tr>
            <tr><td style="padding:4px 0 7px 16px; color:#555; font-size:12px;">Hak Bengkel (50% Jasa)</td><td style="text-align:right; color:#16a34a; font-weight:bold; font-size:12px;">${formatRupiah(jasaBengkel)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pendapatan Kasir</td><td style="text-align:right; font-weight:bold; color:#2563eb;">${formatRupiah(totalKasir)}</td></tr>
            <tr><td style="padding:7px 0; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">TOTAL PEMASUKAN KOTOR</td><td style="text-align:right; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">${formatRupiah(totalPemasukanKotor)}</td></tr>
            
            <tr><td style="padding:7px 0; color:#555;">Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">${formatRupiah(untungParts)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pengeluaran Ops & Gaji</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-${formatRupiah(pengeluaranOperasional)}</td></tr>
            ${pengeluaranBelanjaParts > 0 ? `<tr><td style="padding:7px 0; color:#888;">(Info: Uang keluar utk Belanja Stok)</td><td style="text-align:right; font-weight:normal; color:#888;">(${formatRupiah(pengeluaranBelanjaParts)})</td></tr>` : ''}
            ${totalPiutang > 0 ? `<tr><td style="padding:7px 0; color:#555;">Piutang Belum Lunas</td><td style="text-align:right; font-weight:bold; color:#ea580c;">${formatRupiah(totalPiutang)}</td></tr>` : ''}
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">TOTAL PENDAPATAN BERSIH</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:${labaRekapan >= 0 ? '#1d4ed8' : '#dc2626'}">${formatRupiah(labaRekapan)}</td>
            </tr>
          </tbody>
        </table>
      </div>` : `<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Kinerja Mekanik: ${mechanicFilter}</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">${formatRupiah(untungParts)}</td></tr>
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:14px; font-weight:bold; color:#111;">HAK MEKANIK (50% JASA)</td>
              <td style="text-align:right; font-size:16px; font-weight:bold; border-top:2px solid #1f2937; color:#166534">${formatRupiah(totalJasaAll * 0.5)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 8px; font-size:14px; font-weight:bold; color:#111;">HAK BENGKEL (50% JASA + UNTUNG PARTS)</td>
              <td style="text-align:right; font-size:16px; font-weight:bold; color:#1d4ed8">${formatRupiah((totalJasaAll * 0.5) + untungParts)}</td>
            </tr>
          </tbody>
        </table>
      </div>`}

      ${rekapanWithDetail.length > 0 ? `
      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Pelanggan</th><th>Motor / Plat</th><th>Mekanik</th>
          <th class="right">Jasa</th><th class="right">Parts</th>
          <th class="right">Modal</th><th class="right">Untung Parts</th>
          <th class="right">Total</th><th class="center">Status</th>
        </tr></thead>
        <tbody>${rekapanRows}</tbody>
      </table>` : ''}

      ${kasirTrx.length > 0 && mechanicFilter === 'ALL' ? `
      <div class="section">🧾 DETAIL TRANSAKSI KASIR (ECER)</div>
      <table>
        <thead><tr><th width="20%">Waktu</th><th width="30%">No. Nota</th><th width="30%">Metode Bayar</th><th width="20%" class="right">Total (Rp)</th></tr></thead>
        <tbody>${kasirRows}</tbody>
      </table>` : ''}

      ${expenses.filter(e => !isBelanja(e.category)).length > 0 && mechanicFilter === 'ALL' ? `
      <div class="section">PENGELUARAN OPERASIONAL & GAJI</div>
      <table>
        <thead><tr><th width="15%">Tanggal</th><th width="25%">Kategori</th><th width="40%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>${expenseOpsRows}</tbody>
        <tfoot><tr><td colspan="3" style="padding:6px 8px; font-weight:bold;">Total Pengeluaran Ops & Gaji</td><td class="right bold red" style="padding:6px 8px;">-${formatRupiah(pengeluaranOperasional)}</td></tr></tfoot>
      </table>` : ''}

      ${expenses.filter(e => isBelanja(e.category)).length > 0 && mechanicFilter === 'ALL' ? `
      <div class="section" style="background:#92400e;">BELANJA STOK / PARTS (CATATAN ARUS KAS)</div>
      <p style="font-size:11px; color:#92400e; background:#fef3c7; border:1px solid #fcd34d; border-radius:6px; padding:8px 12px; margin-bottom:8px;">
        Catatan: Belanja stok di bawah ini sudah/akan terhitung sebagai Modal HPP saat parts digunakan di nota rekapan. Angka ini hanya rekaman arus kas keluar, tidak mengurangi laba bersih.
      </p>
      <table>
        <thead><tr><th width="15%">Tanggal</th><th width="25%">Kategori</th><th width="40%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>${expenseBelanjaRows}</tbody>
        <tfoot><tr><td colspan="3" style="padding:6px 8px; font-weight:bold;">Total Belanja Stok (Info Arus Kas)</td><td class="right bold" style="color:#ea580c; padding:6px 8px;">${formatRupiah(pengeluaranBelanjaParts)}</td></tr></tfoot>
      </table>` : ''}

      ${rekapanWithDetail.filter(t => t.sisa > 0).length > 0 && mechanicFilter === 'ALL' ? `
      <div class="section" style="background:#b45309;">PIUTANG BELUM LUNAS</div>
      <table>
        <thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Motor</th><th>Mekanik</th><th class="right">Total</th><th class="right">Dibayar</th><th class="right">Sisa Hutang</th><th class="center">Status</th></tr></thead>
        <tbody>${piutangRows}</tbody>
        <tfoot><tr><td colspan="6" style="padding:6px 8px; font-weight:bold;">Total Piutang Belum Lunas</td><td class="right bold red" style="padding:6px 8px;">${formatRupiah(totalPiutang)}</td><td></td></tr></tfoot>
      </table>` : ''}

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada ${new Date().toLocaleString('id-ID')}</div>
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
      ['Tanggal', 'Pelanggan', 'Motor / Plat', 'Mekanik', 'Total Jasa', 'Total Parts', 'Total Modal', 'Untung Parts', 'Total Tagihan', 'Dibayar', 'Sisa Hutang', 'Status'],
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

      {/* FILTER DATE */}
      {FilterUI}

      {/* FILTER MECHANIC */}
      <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700">🔧 Filter Mekanik:</span>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 min-w-[160px]"
          value={mechanicFilter}
          onChange={e => setMechanicFilter(e.target.value)}
        >
          <option value="ALL">Semua Mekanik</option>
          {mechanics.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {mechanicFilter !== 'ALL' && (
          <span className="text-sm text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            Menampilkan data: {mechanicFilter}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      {mechanicFilter === 'ALL' ? (
        <>
          {/* Baris Rincian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Total Pemasukan Kotor', value: formatRupiah(totalPemasukanKotor), color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4 shadow-sm`}>
                <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
                <p className={`text-base font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Baris Selisih & Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Hak Mekanik (50% Jasa)', value: formatRupiah(hakMekanik), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Pengeluaran Ops & Gaji', value: formatRupiah(pengeluaranOperasional), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Belanja Stok (Info)', value: formatRupiah(pengeluaranBelanjaParts), color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
              { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-4 shadow-sm`}>
                <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
                <p className={`text-base font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Total Pendapatan Bersih */}
          <div className={`${labaRekapan >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'} border rounded-xl p-4 shadow-sm`}>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Pendapatan Bersih (Hak Bengkel)</p>
            <p className={`text-2xl font-bold ${labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700'}`}>{formatRupiah(labaRekapan)}</p>
            <p className="text-xs text-gray-400 mt-1">50% Jasa Bengkel + Untung Parts + Kasir - Pengeluaran Ops</p>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Total Jasa Servis</p>
              <p className="text-xl font-bold text-green-700">{formatRupiah(totalJasaAll)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Penjualan Parts</p>
              <p className="text-xl font-bold text-blue-700">{formatRupiah(totalPartAll)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Modal / HPP Parts</p>
              <p className="text-xl font-bold text-red-600">-{formatRupiah(totalModal)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Untung dari Parts</p>
              <p className={`text-xl font-bold ${untungParts >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatRupiah(untungParts)}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Kontribusi Mekanik</p>
            <p className="text-2xl font-bold text-blue-800">{formatRupiah(totalJasaAll + untungParts)}</p>
            <p className="text-xs text-gray-500 mt-1">Jasa + Untung Parts</p>
          </div>
        </>
      )}

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
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Untung Parts</th>
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
                {/* Tabel TOTAL di bawah tabel transaksi */}
                <div className="border-t bg-gray-50">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-3 font-semibold text-gray-700 w-1/2">TOTAL : Jasa Servis</td>
                        <td className="px-4 py-3 font-bold text-green-700 text-right">{formatRupiah(mech.totalJasa)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 text-right">
                          Mekanik 50%: <span className="text-green-600 font-semibold">{formatRupiah(mech.totalJasa * 0.5)}</span>
                          {' | '}
                          Bengkel 50%: <span className="text-blue-600 font-semibold">{formatRupiah(mech.totalJasa * 0.5)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-gray-700">TOTAL : Untung Parts</td>
                        <td className="px-4 py-3 font-bold text-blue-700 text-right">{formatRupiah(mech.totalUntungParts)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 text-right">100% Hak Bengkel</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kasir Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" /> Transaksi Kasir
          <span className="ml-auto text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">{formatRupiah(totalKasir)}</span>
        </h2>
        <div className="space-y-2">
          {kasirTrx.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-gray-400 text-sm">Belum ada transaksi kasir di periode ini</div>
          ) : kasirTrx.map(t => {
            const items = itemsByTrx[t.id] || []
            const totalModal = items.reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
            const untung = t.total - totalModal
            return (
              <div key={t.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                {/* Header nota */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500">{new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-mono text-xs font-bold text-gray-700">{t.transaction_number}</span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">{t.payment_method}</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatRupiah(t.total)}</span>
                </div>
                {/* Detail item */}
                {items.length > 0 && (
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 text-xs">Nama Barang / Jasa</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-500 text-xs">Qty</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 text-xs">Modal</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 text-xs">Harga Jual</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-500 text-xs">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2 text-gray-800">{item.item_name}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-red-500 text-xs">{item.modal_price ? formatRupiah((item.modal_price || 0) * (item.quantity || 1)) : '-'}</td>
                          <td className="px-4 py-2 text-right text-gray-700">{formatRupiah(item.unit_price)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatRupiah(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200 text-xs">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-gray-500">
                          {totalModal > 0 && <span>Modal total: <span className="text-red-600 font-semibold">{formatRupiah(totalModal)}</span></span>}
                        </td>
                        <td colSpan={2} className="px-4 py-2 text-right text-gray-500">
                          {totalModal > 0 && <span>Untung: <span className="text-green-700 font-semibold">{formatRupiah(untung)}</span></span>}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">{formatRupiah(t.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expenses - Ops & Gaji */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-600" /> Pengeluaran Operasional & Gaji
          <span className="ml-auto text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">{formatRupiah(pengeluaranOperasional)}</span>
        </h2>
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {expenses.filter(e => !isBelanja(e.category)).length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Belum ada pengeluaran ops di periode ini</div>
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
                {expenses.filter(e => !isBelanja(e.category)).map((e, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">{e.category}</span></td>
                    <td className="px-4 py-3 text-gray-700">{e.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">Total Pengeluaran Ops & Gaji</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(pengeluaranOperasional)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Belanja Stok */}
      {pengeluaranBelanjaParts > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-500" /> Belanja Stok / Parts
            <span className="ml-auto text-sm font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg">{formatRupiah(pengeluaranBelanjaParts)}</span>
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-xs text-orange-700">
            Catatan: Belanja stok di bawah ini sudah/akan terhitung sebagai <strong>Modal HPP</strong> saat parts digunakan di nota rekapan. Angka ini hanya rekaman arus kas keluar, tidak mengurangi laba lagi.
          </div>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
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
                {expenses.filter(e => isBelanja(e.category)).map((e, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded">{e.category}</span></td>
                    <td className="px-4 py-3 text-gray-700">{e.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{formatRupiah(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-semibold text-gray-700">Total Belanja Stok (Hanya Info)</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">{formatRupiah(pengeluaranBelanjaParts)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Piutang Belum Lunas */}
      {rekapanWithDetail.filter(t => t.sisa > 0).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-yellow-600" /> Piutang Belum Lunas
            <span className="ml-auto text-sm font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-lg">{formatRupiah(totalPiutang)}</span>
          </h2>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Pelanggan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Motor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mekanik</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Dibayar</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600 text-red-600">Sisa Hutang</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rekapanWithDetail.filter(t => t.sisa > 0).map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{t.motor}</td>
                    <td className="px-4 py-3 text-gray-600">{t.mekanik}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatRupiah(t.total)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatRupiah(t.amount_paid || 0)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(t.sisa)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded border border-yellow-200">{t.payment_status || 'DP'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td colSpan={6} className="px-4 py-3 font-semibold text-gray-700">Total Piutang Belum Lunas</td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">{formatRupiah(totalPiutang)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

