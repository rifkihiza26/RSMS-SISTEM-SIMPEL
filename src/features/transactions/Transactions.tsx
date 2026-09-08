import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { formatRupiah, formatDateShort } from '@/lib/utils'
import { downloadPDF } from '@/lib/pdf'
import { Search, Eye , Trash, Printer } from 'lucide-react'

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
  notes?: string | null
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
  const { isOwner } = useAuth()
  const qc = useQueryClient()
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

  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] })
  })

  const filtered = transactions.filter(t =>
    t.transaction_number.toLowerCase().includes(search.toLowerCase())
  )

  const detailTrx = transactions.find(t => t.id === detailId)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>

      <div className="bg-white border rounded-xl shadow-sm p-4 flex flex-wrap gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 border rounded-lg px-3 py-2 overflow-hidden">
          <Search className="h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Cari nomor transaksi..." className="flex-1 text-sm outline-none min-w-0 w-full" value={search} onChange={e => setSearch(e.target.value)} />
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
                    <td className="px-4 py-3 text-right flex justify-end gap-1">
                      <button onClick={() => setDetailId(t.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10" title="Detail"><Eye className="h-4 w-4" /></button>
                      {isOwner && <button onClick={() => { if(confirm('Yakin hapus transaksi beserta itemnya? Pemasukan terkait akan terhapus juga otomatis jika ada cascade, tapi stok tidak kembali otomatis.')) deleteMutation.mutate(t.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}
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
              
              <div className="flex gap-2">
                <button onClick={() => downloadPDF('reprint-receipt', 'Invoice-' + detailTrx.transaction_number)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Cetak PDF</button>
              </div>

              {/* Hidden Receipt Format for printing */}
              <div className="hidden">
                <div id="reprint-receipt" className="bg-white text-black w-[400px] p-6 text-sm font-sans mx-auto">
                  <div className="text-center mb-6">
                    <img src="/logo.png" alt="Logo" className="h-14 mx-auto mb-2" />
                    <h2 className="text-xl font-bold font-serif mb-1">RAKYAT SINTING</h2>
                    <p className="text-xs text-gray-600 leading-tight">Jln. Pejaten Raya RT.01/RW.07 No. 3<br />Kecamatan Pasar Minggu, Jakarta Selatan<br />WA: 0813-8760-7676</p>
                  </div>
                  <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4 text-xs space-y-1">
                    <div className="flex justify-between"><span>No: {detailTrx.transaction_number}</span><span>{formatDateShort(detailTrx.created_at)}</span></div>
                    <div className="flex justify-between"><span>KSR: {detailTrx.profiles?.full_name ?? '-'}</span><span>{detailTrx.notes || '-'}</span></div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {detailItems.map(item => (
                      <div key={item.id} className="text-xs">
                        <div className="font-semibold">{item.item_name}</div>
                        <div className="flex justify-between text-gray-600">
                          <span>{item.quantity} x {formatRupiah(item.unit_price)}</span>
                          <span>{formatRupiah(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                    {detailTrx.discount > 0 && <div className="flex justify-between text-gray-600"><span>Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                    <div className="flex justify-between font-bold text-sm pt-1"><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                    <div className="flex justify-between pt-1"><span>{detailTrx.payment_method}</span><span>{detailTrx.payment_method === 'CASH' ? formatRupiah(detailTrx.paid_amount) : formatRupiah(detailTrx.total)}</span></div>
                    {detailTrx.payment_method === 'CASH' && <div className="flex justify-between"><span>Kembali</span><span>{formatRupiah(detailTrx.change_amount)}</span></div>}
                  </div>
                  <div className="text-center mt-8 text-xs text-gray-500 italic border-t border-dashed border-gray-300 pt-4">Terima kasih atas kunjungan Anda.<br/>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</div>
                </div>
              </div>
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
