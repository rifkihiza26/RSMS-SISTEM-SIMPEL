const fs = require('fs');

const code = `import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, XCircle, Wallet, FileText, Sheet, ClipboardList } from 'lucide-react'
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

function useDashboardData() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'
  const bulanLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const { data: monthItems = [] } = useQuery({
    queryKey: ['dashboard', 'items-month'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_items').select('item_type, subtotal, quantity, modal_price, created_at')
        .gte('created_at', monthStart + 'T00:00:00')
      return data ?? []
    }
  })

  const { data: monthExpenses = [] } = useQuery({
    queryKey: ['dashboard', 'expenses-month'],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount, category, date, description')
        .gte('date', monthStart)
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
      <html><head><title>Laporan Laba Rugi \${bulanLabel}</title>
      <style>
        body { font-family: sans-serif; padding: 32px; font-size: 13px; color: #111; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { color: #666; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #1e293b; color: #fff; padding: 8px 12px; text-align: left; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .section { margin-top: 28px; font-size: 14px; font-weight: 700; color: #374151; border-bottom: 2px solid #374151; padding-bottom: 4px; margin-bottom: 8px; }
        .total-row { background: #f1f5f9; }
        .laba-row { background: #dcfce7; }
        .rugi-row { background: #fee2e2; }
      </style></head><body>
      <h1>RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Laporan Laba Rugi — \${bulanLabel}</div>

      <div class="section">PEMASUKAN</div>
      <table>
        <tr><th>Keterangan</th><th class="right">Jumlah</th></tr>
        <tr><td>Pendapatan Jasa</td><td class="right">\${formatRupiah(totalJasa)}</td></tr>
        <tr><td>Pendapatan Barang / Part (Harga Jual)</td><td class="right">\${formatRupiah(totalBarang)}</td></tr>
        <tr class="total-row"><td class="bold">Total Pemasukan</td><td class="right bold">\${formatRupiah(totalJasa + totalBarang)}</td></tr>
      </table>

      <div class="section">HPP & LABA KOTOR</div>
      <table>
        <tr><th>Keterangan</th><th class="right">Jumlah</th></tr>
        <tr><td>Modal / HPP Barang</td><td class="right">\${formatRupiah(totalModalBarang)}</td></tr>
        <tr class="total-row"><td class="bold">Estimasi Laba Kotor</td><td class="right bold">\${formatRupiah(profitKotor)}</td></tr>
      </table>

      <div class="section">PENGELUARAN</div>
      <table>
        <tr><th>Keterangan</th><th class="right">Jumlah</th></tr>
        <tr><td>Penggajian Mekanik</td><td class="right">\${formatRupiah(totalGaji)}</td></tr>
        <tr><td>Operasional Bengkel</td><td class="right">\${formatRupiah(totalPengeluaranLain)}</td></tr>
        <tr class="total-row"><td class="bold">Total Pengeluaran</td><td class="right bold">\${formatRupiah(totalGaji + totalPengeluaranLain)}</td></tr>
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
      [\`Periode: \${bulanLabel}\`],
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

    XLSX.writeFile(wb, \`Laporan-\${bulanLabel.replace(' ', '-')}.xlsx\`)
  }

  return { 
    bulanLabel, monthStart, today, 
    totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih,
    downloadPDF, downloadExcel 
  }
}

// ------------------------------------------
// OWNER DASHBOARD (Helicopter View)
// ------------------------------------------
function OwnerDashboard() {
  const { bulanLabel, totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitBersih, downloadPDF, downloadExcel } = useDashboardData()

  // Fetch only Recaps (transactions containing REKAPAN in notes)
  const { data: recentRecaps = [] } = useQuery({
    queryKey: ['dashboard', 'recent-recaps'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanics(name)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false }).limit(5)
      return data ?? []
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Owner</h1>
          <p className="text-sm text-gray-500 mt-1">Ringkasan Bisnis Bulan Ini — \${formatDateShort(new Date())}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="TOTAL PENDAPATAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Barang" />
        <StatCard title="TOTAL PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle="Bulan Ini" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Hasil Rekapan Terbaru</h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {recentRecaps.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada rekapan servis</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mekanik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {recentRecaps.map((trx: any) => (
                  <tr key={trx.transaction_number} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{trx.transaction_number}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(trx.created_at)}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{(trx.mechanics as any)?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(trx.total)}</td>
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


// ------------------------------------------
// ADMIN DASHBOARD (Detailed View)
// ------------------------------------------
function AdminDashboard() {
  const { bulanLabel, totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel } = useDashboardData()

  const { data: products = [] } = useQuery({
    queryKey: ['dashboard', 'products-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('stock, minimum_stock').eq('status', 'ACTIVE')
      return data ?? []
    }
  })

  const { data: recentTrx = [] } = useQuery({
    queryKey: ['dashboard', 'recent-trx'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('transaction_number, total, payment_method, status, created_at')
        .order('created_at', { ascending: false }).limit(5)
      return data ?? []
    }
  })

  const totalProducts = products.length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minimum_stock).length
  const outStock = products.filter(p => p.stock === 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Rekap Bulan Ini — {formatDateShort(new Date())}</p>
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

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Keuangan Bulan Ini — {bulanLabel}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pemasukan Jasa" value={formatRupiah(totalJasa)} icon={TrendingUp} color="blue" />
          <StatCard title="Pemasukan Barang" value={formatRupiah(totalBarang)} icon={Package} color="blue" />
          <StatCard title="Total Pemasukan" value={formatRupiah(totalJasa + totalBarang)} icon={Wallet} color="green" />
          <StatCard title="Estimasi Laba Kotor" value={formatRupiah(profitKotor)} icon={TrendingUp} color="green" subtitle="Pemasukan - Modal Barang" />

          <StatCard title="Pengeluaran Gaji" value={formatRupiah(totalGaji)} icon={TrendingDown} color="orange" />
          <StatCard title="Pengeluaran Operasional" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" />
          <StatCard title="Total Pengeluaran" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={Wallet} color="red" />
          <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'green' : 'red'} subtitle="Laba Kotor - Total Pengeluaran" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Stok Produk</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Produk" value={String(totalProducts)} icon={Package} color="blue" />
          <StatCard title="Stok Menipis" value={String(lowStock)} icon={AlertTriangle} color="orange" />
          <StatCard title="Stok Habis" value={String(outStock)} icon={XCircle} color="red" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Transaksi Terbaru</h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {recentTrx.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Belum ada transaksi</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tanggal</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Metode</th>
                </tr>
              </thead>
              <tbody>
                {recentTrx.map((trx: { transaction_number: string; total: number; payment_method: string; created_at: string }) => (
                  <tr key={trx.transaction_number} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{trx.transaction_number}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(trx.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(trx.total)}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{trx.payment_method}</span>
                    </td>
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

// ------------------------------------------
// KASIR DASHBOARD (Daily View)
// ------------------------------------------
function KasirDashboard() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'kasir-stats', today],
    queryFn: async () => {
      const { data: trxs } = await supabase.from('transactions')
        .select('total, payment_method')
        .in('status', ['COMPLETED', 'PAID'])
        .gte('created_at', today + 'T00:00:00+07:00')
        .lte('created_at', today + 'T23:59:59+07:00')
      const all = trxs ?? []
      return {
        total: all.reduce((s, t) => s + t.total, 0),
        count: all.length,
        cash: all.filter(t => t.payment_method === 'CASH').reduce((s, t) => s + t.total, 0),
        qris: all.filter(t => t.payment_method === 'QRIS').reduce((s, t) => s + t.total, 0),
        transfer: all.filter(t => t.payment_method === 'TRANSFER').reduce((s, t) => s + t.total, 0),
      }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Kasir</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDateShort(new Date())}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Penjualan Hari Ini" value={formatRupiah(stats?.total ?? 0)} icon={TrendingUp} color="green" />
        <StatCard title="Jumlah Transaksi" value={String(stats?.count ?? 0)} icon={ShoppingCart} color="blue" />
        <StatCard title="Cash" value={formatRupiah(stats?.cash ?? 0)} icon={Wallet} color="purple" />
        <StatCard title="QRIS" value={formatRupiah(stats?.qris ?? 0)} icon={Wallet} color="orange" />
        <StatCard title="Transfer" value={formatRupiah(stats?.transfer ?? 0)} icon={Wallet} color="blue" />
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
