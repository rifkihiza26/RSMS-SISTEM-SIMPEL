import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { Search, Eye } from 'lucide-react'

type Transaction = {
  id: string
  transaction_number: string
  total: number
  discount: number
  subtotal: number
  payment_method: string
  paid_amount: number
  change_amount: number
  status: string
  created_at: string
  profiles?: { full_name: string | null } | null
}

type TrxItem = {
  id: string
  item_type: string
  item_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

function Badge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    CASH: 'bg-green-100 text-green-700',
    QRIS: 'bg-blue-100 text-blue-700',
    TRANSFER: 'bg-purple-100 text-purple-700',
  }
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[method] ?? 'bg-gray-100 text-gray-600'}`}>{method}</span>
}

export function Transactions() {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', dateFrom, dateTo, payFilter],
    queryFn: async () => {
      let q = supabase.from('transactions').select('*, profiles(full_name)').order('created_at', { ascending: false })
      if (dateFrom) q = q.gte('created_at', dateFrom + 'T00:00:00')
      if (dateTo) q = q.lte('created_at', dateTo + 'T23:59:59')
      if (payFilter) q = q.eq('payment_method', payFilter)
      const { data } = await q
      return (data ?? []) as Transaction[]
    }
  })

  const { data: detailItems = [], isFetching: detailLoading } = useQuery({
    queryKey: ['transaction-items', detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const { data } = await supabase.from('transaction_items').select('*').eq('transaction_id', detailId!)
      return (data ?? []) as TrxItem[]
    }
  })

  const filtered = transactions.filter(t =>
    t.transaction_number.toLowerCase().includes(search.toLowerCase())
  )

  const detailTrx = transactions.find(t => t.id === detailId)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>

      <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48 border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Cari nomor transaksi..." className="flex-1 text-sm outline-none" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
        <select value={payFilter} onChange={e => setPayFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
          <option value="">Semua Metode</option>
          <option value="CASH">CASH</option>
          <option value="QRIS">QRIS</option>
          <option value="TRANSFER">TRANSFER</option>
        </select>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat transaksi...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Tidak ada transaksi ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nomor Transaksi</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Tanggal</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Metode</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Kasir</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.transaction_number}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDateShort(t.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(t.total)}</td>
                    <td className="px-4 py-3 text-center"><Badge method={t.payment_method} /></td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{t.profiles?.full_name ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailId(t.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10"><Eye className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailId && detailTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <div>
                <h2 className="font-semibold text-gray-900">{detailTrx.transaction_number}</h2>
                <p className="text-xs text-gray-400">{formatDateShort(detailTrx.created_at)}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading ? (
                <div className="text-center py-6 text-gray-400 text-sm">Memuat detail...</div>
              ) : (
                <div className="space-y-2">
                  {detailItems.map(i => (
                    <div key={i.id} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{i.item_name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${i.item_type === 'PRODUCT' ? 'bg-primary/10 text-primary' : i.item_type === 'SERVICE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{i.item_type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{i.quantity} × {formatRupiah(i.unit_price)}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatRupiah(i.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                {detailTrx.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Pembayaran</span><Badge method={detailTrx.payment_method} /></div>
                {detailTrx.payment_method === 'CASH' && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Uang Dibayar</span><span>{formatRupiah(detailTrx.paid_amount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span>{formatRupiah(detailTrx.change_amount)}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
