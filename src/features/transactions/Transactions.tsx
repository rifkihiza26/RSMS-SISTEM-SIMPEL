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
  const { isOwner, isAdmin } = useAuth()
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
                      {(isOwner || isAdmin) && <button onClick={() => { if(confirm('Yakin hapus transaksi beserta itemnya? Pemasukan terkait akan terhapus juga otomatis jika ada cascade, tapi stok tidak kembali otomatis.')) deleteMutation.mutate(t.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}
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
                <button onClick={() => {
                  const el = document.getElementById('reprint-receipt')
                  if (!el) return
                  const win = window.open('', '_blank')
                  if (!win) return
                  win.document.write('<html><head><title>Struk - ' + detailTrx.transaction_number + '</title>')
                  win.document.write('<style>@media print { .no-print { display: none !important; } } body{font-family:monospace;font-size:12px;margin:0;padding:16px;width:320px;color:black;background:white}.center{text-align:center}.row{display:flex;justify-content:space-between;margin-bottom:3px}.bold{font-weight:bold}.small{font-size:11px}.separator{border-top:1px dashed #000;margin:6px 0;border-bottom:none}.separator-solid{border-top:1px solid #000;margin:6px 0;border-bottom:none}.logo{width:140px;height:auto;object-fit:contain;margin:0 auto 6px;display:block}.row-item-name{margin-bottom:2px}</style>')
                  win.document.write('</head><body>')
                  win.document.write('<div class="no-print" style="text-align:center; margin-bottom: 20px; padding: 15px; background: #f3f4f6; font-family: sans-serif;"><button onclick="window.close()" style="padding: 10px 20px; background: #fff; border: 1px solid #ccc; border-radius: 6px; font-weight: bold; margin-right: 10px; cursor: pointer;">Kembali</button><button onclick="window.print()" style="padding: 10px 20px; background: #0ea5e9; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Ulang</button></div>')
                  win.document.write(el.outerHTML)
                  win.document.write('</body></html>')
                  win.document.close()
                  setTimeout(() => { win.print() }, 500)
                }} className="flex-1 bg-primary text-white hover:bg-primary/90 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Struk</button>
                <button onClick={() => downloadPDF('reprint-receipt', 'Invoice-' + detailTrx.transaction_number)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">⬇️ PDF</button>
              </div>

                            {/* Hidden Receipt Format for printing */}
              <div id="reprint-receipt" className="hidden" style={{background:'white', padding:'16px', maxWidth:'320px', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
                {/* Header */}
                <div style={{textAlign:'center'}}>
                  <img src="/logo.png" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
                  <div style={{fontWeight:'bold', fontSize:'13px'}}>RAKYAT SINTING MATIC SHOP</div>
                  <div style={{fontSize:'10px', marginTop:'3px', lineHeight:'1.5'}}>Jln. Pejaten Raya RT.01/RW.07 No. 3, Kel. Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan 12510</div>
                  <div style={{fontSize:'10px'}}>WA / Telp: 0813-8760-7676</div>
                </div>
                <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Transaction Info */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span style={{fontWeight:'bold'}}>No. Transaksi:</span><span>{detailTrx.transaction_number}</span></div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Tanggal:</span><span>{new Date(detailTrx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Jam:</span><span>{new Date(detailTrx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
                {detailTrx.notes && detailTrx.notes.split(' | ').map((n: string, i: number) => {
                   const [k, v] = n.split(': ')
                   return k && v ? <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>{k}:</span><span style={{fontWeight:'bold'}}>{v}</span></div> : null
                })}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Items */}
                <div style={{fontWeight:'bold', fontSize:'10px', marginBottom:'4px'}}>ITEM PEMBELIAN</div>
                {detailItems.map((i: any) => (
                  <div key={i.id} style={{marginBottom:'5px'}}>
                    <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'2px'}}>{i.item_name}</div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:'11px'}}>{i.quantity} × {formatRupiah(i.unit_price)}</span>
                      <span style={{fontSize:'11px', fontWeight:'bold'}}>{formatRupiah(i.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Totals */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                {detailTrx.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px', fontWeight:'bold'}}><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Payment */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Metode Bayar</span><span style={{fontWeight:'bold'}}>{detailTrx.payment_method}</span></div>
                {detailTrx.payment_method === 'CASH' && (
                  <div style={{width:'100%'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Uang Diterima</span><span>{formatRupiah(detailTrx.paid_amount)}</span></div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Kembalian</span><span style={{fontWeight:'bold'}}>{formatRupiah(detailTrx.change_amount)}</span></div>
                  </div>
                )}
                <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Footer */}
                <div style={{textAlign:'center', marginTop:'12px', fontSize:'11px'}}>
                  <div>Terima kasih telah mempercayakan</div>
                  <div>kendaraan Anda kepada kami!</div>
                  <div style={{marginTop:'6px', fontWeight:'bold'}}>— Rakyat Sinting Matic Shop —</div>
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
