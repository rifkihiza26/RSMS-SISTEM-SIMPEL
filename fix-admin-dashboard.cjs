const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

const newAdminDashboard = `function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  // Fetch Items Bulan Ini
  const { data: monthItems = [] } = useQuery({
    queryKey: ['dashboard', 'items-month'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_items').select('item_type, subtotal, quantity, modal_price, created_at')
        .gte('created_at', monthStart + 'T00:00:00')
      return data ?? []
    }
  })

  // Fetch Expenses Bulan Ini
  const { data: monthExpenses = [] } = useQuery({
    queryKey: ['dashboard', 'expenses-month'],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount, category, date')
        .gte('date', monthStart)
      return data ?? []
    }
  })

  // Calculations
  const totalJasa = monthItems.filter(i => ['SERVICE', 'MANUAL_JASA'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalModalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
  
  const totalGaji = monthExpenses.filter(e => e.category === 'Penggajian' || e.category === 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  const totalPengeluaranLain = monthExpenses.filter(e => e.category !== 'Penggajian' && e.category !== 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  
  const profitKotor = totalJasa + (totalBarang - totalModalBarang)
  const profitBersih = profitKotor - (totalGaji + totalPengeluaranLain)

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Owner / Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan Laba Rugi & Rekap Bulan Ini ({formatDateShort(new Date())})</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Laba Rugi Bulan Ini</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-3 gap-4">
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
}`

// Use regex to replace AdminDashboard definition completely.
// Find function AdminDashboard() { ... } down to function KasirDashboard()
const regex = /function AdminDashboard\(\) \{[\s\S]*?\}\n\nfunction KasirDashboard\(\) \{/g;
content = content.replace(regex, newAdminDashboard + '\n\nfunction KasirDashboard() {');

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', content);
