import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { Search, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'

type Product = {
  id: string
  sku: string
  name: string
  brand: string | null
  unit: string | null
  selling_price: number
  stock: number
  minimum_stock: number
  status: string
  product_categories?: { name: string } | null
}

type Movement = {
  id: string
  product_id: string | null
  movement_type: string
  quantity: number
  stock_before: number
  stock_after: number
  reference_type: string | null
  reason: string | null
  created_at: string
  products?: { name: string; sku: string } | null
}

export function Inventory() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all')
  const [tab, setTab] = useState<'stock' | 'movements'>('stock')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .order('stock', { ascending: true })
      return (data ?? []) as Product[]
    }
  })

  const { data: movements = [], isLoading: movLoading } = useQuery({
    queryKey: ['stock-movements'],
    enabled: tab === 'movements',
    queryFn: async () => {
      const { data } = await supabase
        .from('stock_movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(100)
      return (data ?? []) as Movement[]
    }
  })

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
    if (filterStatus === 'low') return matchSearch && p.stock > 0 && p.stock <= p.minimum_stock
    if (filterStatus === 'out') return matchSearch && p.stock === 0
    return matchSearch
  })

  const totalProducts = products.length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minimum_stock).length
  const outStock = products.filter(p => p.stock === 0).length
  const totalValue = products.reduce((s, p) => s + p.selling_price * p.stock, 0)

  function stockBadge(p: Product) {
    if (p.stock === 0)
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          <XCircle className="h-3 w-3" /> HABIS
        </span>
      )
    if (p.stock <= p.minimum_stock)
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
          <AlertTriangle className="h-3 w-3" /> MENIPIS
        </span>
      )
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        <CheckCircle className="h-3 w-3" /> AMAN
      </span>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor kondisi stok produk bengkel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Produk</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</p>
        </div>
        <div
          className="bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:border-orange-400 transition-colors"
          onClick={() => setFilterStatus(filterStatus === 'low' ? 'all' : 'low')}
        >
          <p className="text-xs text-orange-600 font-medium">⚠️ Stok Menipis</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{lowStock}</p>
        </div>
        <div
          className="bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:border-red-400 transition-colors"
          onClick={() => setFilterStatus(filterStatus === 'out' ? 'all' : 'out')}
        >
          <p className="text-xs text-red-600 font-medium">❌ Stok Habis</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{outStock}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Est. Nilai Stok</p>
          <p className="text-lg font-bold text-blue-600 mt-1">{formatRupiah(totalValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('stock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'stock' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Kondisi Stok
        </button>
        <button
          onClick={() => setTab('movements')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'movements' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          Riwayat Pergerakan
        </button>
      </div>

      {tab === 'stock' && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 shadow-sm">
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari nama, SKU, brand..."
                className="flex-1 text-sm outline-none bg-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as 'all' | 'low' | 'out')}
              className="border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 shadow-sm"
            >
              <option value="all">Semua Stok</option>
              <option value="low">⚠️ Menipis</option>
              <option value="out">❌ Habis</option>
            </select>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {filterStatus !== 'all' ? 'Tidak ada produk dengan kondisi tersebut.' : 'Belum ada produk.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Produk</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Stok</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Min. Stok</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Harga Jual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50 ${p.stock === 0 ? 'bg-red-50/30' : p.stock <= p.minimum_stock ? 'bg-orange-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.product_categories?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-gray-900">{p.stock} <span className="text-xs text-gray-400 font-normal">{p.unit ?? 'pcs'}</span></td>
                        <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{p.minimum_stock}</td>
                        <td className="px-4 py-3 text-center">{stockBadge(p)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 hidden md:table-cell">{formatRupiah(p.selling_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {movLoading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Memuat riwayat...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada riwayat pergerakan stok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Produk</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipe</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Qty</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Sebelum</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Sesudah</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Keterangan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{m.products?.name ?? '-'}</p>
                        <p className="text-[11px] text-gray-400">{m.products?.sku ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          m.movement_type === 'IN' ? 'bg-green-100 text-green-700' :
                          m.movement_type === 'OUT' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {m.movement_type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-center font-bold ${m.movement_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.movement_type === 'IN' ? '+' : '-'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 hidden sm:table-cell">{m.stock_before}</td>
                      <td className="px-4 py-3 text-center text-gray-900 font-semibold hidden sm:table-cell">{m.stock_after}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.reason ?? m.reference_type ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateShort(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
