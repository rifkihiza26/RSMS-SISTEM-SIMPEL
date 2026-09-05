import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, ShoppingCart, Package, AlertTriangle, XCircle, Wallet } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }: {
  title: string; value: string; icon: React.ElementType; color?: string; subtitle?: string
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
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colors[color]} flex-shrink-0 ml-3`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const { data: todayIncome = 0 } = useQuery({
    queryKey: ['dashboard', 'income-today'],
    queryFn: async () => {
      const { data } = await supabase.from('incomes').select('amount').gte('date', today).lte('date', today)
      return data?.reduce((s, r) => s + r.amount, 0) ?? 0
    }
  })

  const { data: todayExpense = 0 } = useQuery({
    queryKey: ['dashboard', 'expense-today'],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount').gte('date', today).lte('date', today)
      return data?.reduce((s, r) => s + r.amount, 0) ?? 0
    }
  })

  const { data: monthIncome = 0 } = useQuery({
    queryKey: ['dashboard', 'income-month'],
    queryFn: async () => {
      const { data } = await supabase.from('incomes').select('amount').gte('date', monthStart)
      return data?.reduce((s, r) => s + r.amount, 0) ?? 0
    }
  })

  const { data: monthExpense = 0 } = useQuery({
    queryKey: ['dashboard', 'expense-month'],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount').gte('date', monthStart)
      return data?.reduce((s, r) => s + r.amount, 0) ?? 0
    }
  })

  const { data: todayTrx = 0 } = useQuery({
    queryKey: ['dashboard', 'trx-today'],
    queryFn: async () => {
      const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00').lte('created_at', today + 'T23:59:59')
      return count ?? 0
    }
  })

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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">{formatDateShort(new Date())}</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Hari Ini</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Pemasukan" value={formatRupiah(todayIncome)} icon={TrendingUp} color="green" />
          <StatCard title="Pengeluaran" value={formatRupiah(todayExpense)} icon={TrendingDown} color="red" />
          <StatCard title="Saldo Bersih" value={formatRupiah(todayIncome - todayExpense)} icon={Wallet} color={todayIncome - todayExpense >= 0 ? 'blue' : 'red'} />
          <StatCard title="Transaksi" value={String(todayTrx)} icon={ShoppingCart} color="purple" subtitle="transaksi hari ini" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Bulan Ini</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Pemasukan Bulan Ini" value={formatRupiah(monthIncome)} icon={TrendingUp} color="green" />
          <StatCard title="Pengeluaran Bulan Ini" value={formatRupiah(monthExpense)} icon={TrendingDown} color="red" />
          <StatCard title="Saldo Bersih Bulan Ini" value={formatRupiah(monthIncome - monthExpense)} icon={Wallet} color="blue" />
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
}

function KasirDashboard() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'kasir-stats', today],
    queryFn: async () => {
      const { data: trxs } = await supabase.from('transactions')
        .select('total, payment_method')
        .eq('status', 'COMPLETED')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <KasirDashboard />
}
