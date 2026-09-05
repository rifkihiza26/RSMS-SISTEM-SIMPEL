import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort, generateRestockNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Trash2, X, Eye, Package } from 'lucide-react'

type RestockItem = { product_id: string; product_name: string; sku: string; quantity: number; cost_price: number }
type Restock = {
  id: string
  restock_number: string
  supplier_name: string | null
  total_amount: number
  notes: string | null
  created_at: string
}

type Product = { id: string; sku: string; name: string; cost_price: number }

export function Restocks() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<RestockItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [qtyInput, setQtyInput] = useState('1')
  const [costInput, setCostInput] = useState('')
  const [formError, setFormError] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: restocks = [], isLoading } = useQuery({
    queryKey: ['restocks'],
    queryFn: async () => {
      const { data } = await supabase.from('restocks').select('*').order('created_at', { ascending: false })
      return (data ?? []) as Restock[]
    }
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products-for-restock'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id,sku,name,cost_price').eq('status','ACTIVE').order('name')
      return (data ?? []) as Product[]
    }
  })

  const { data: detailItems = [] } = useQuery({
    queryKey: ['restock-items', detailId],
    enabled: !!detailId,
    queryFn: async () => {
      const { data } = await supabase.from('restock_items').select('*, products(name,sku)').eq('restock_id', detailId!)
      return data ?? []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const restockNumber = generateRestockNumber()
      const totalAmount = items.reduce((s, i) => s + i.quantity * i.cost_price, 0)

      const { data: restockData, error: restockError } = await supabase.from('restocks').insert({
        restock_number: restockNumber,
        supplier_name: supplier.trim() || null,
        total_amount: totalAmount,
        notes: notes.trim() || null,
        created_by: user?.id ?? null,
      }).select().single()
      if (restockError) throw restockError

      const restockId = restockData.id
      const restockItemsPayload = items.map(i => ({
        restock_id: restockId,
        product_id: i.product_id,
        quantity: i.quantity,
        cost_price: i.cost_price,
        subtotal: i.quantity * i.cost_price,
      }))

      const { error: itemsError } = await supabase.from('restock_items').insert(restockItemsPayload)
      if (itemsError) throw itemsError

      // Update stock for each product
      for (const item of items) {
        const prod = products.find(p => p.id === item.product_id)
        if (!prod) continue
        const { data: cur } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
        const newStock = (cur?.stock ?? 0) + item.quantity
        await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', item.product_id)
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          movement_type: 'IN',
          quantity: item.quantity,
          stock_before: cur?.stock ?? 0,
          stock_after: newStock,
          reference_type: 'RESTOCK',
          reference_id: restockId,
          reason: `Restock dari ${supplier || 'Supplier'}`,
          created_by: user?.id ?? null,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restocks'] })
      qc.invalidateQueries({ queryKey: ['inventory-products'] })
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['cashier-products'] })
      setModalOpen(false)
      resetForm()
      setAlert({ type: 'success', msg: 'Restock berhasil dicatat dan stok sudah diperbarui.' })
      setTimeout(() => setAlert(null), 3500)
    },
    onError: () => setFormError('Gagal menyimpan restock. Coba lagi.')
  })

  function resetForm() {
    setSupplier(''); setNotes(''); setItems([])
    setSelectedProduct(null); setQtyInput('1'); setCostInput(''); setFormError('')
  }

  function addItem() {
    if (!selectedProduct) return setFormError('Pilih produk terlebih dahulu.')
    const qty = parseInt(qtyInput) || 0
    const cost = parseFloat(parseCurrencyInput(costInput)) || 0
    if (qty <= 0) return setFormError('Qty harus lebih dari 0.')
    if (cost <= 0) return setFormError('Harga beli harus lebih dari 0.')
    setFormError('')

    const exists = items.find(i => i.product_id === selectedProduct.id)
    if (exists) {
      setItems(prev => prev.map(i => i.product_id === selectedProduct.id
        ? { ...i, quantity: i.quantity + qty, cost_price: cost }
        : i
      ))
    } else {
      setItems(prev => [...prev, {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: qty,
        cost_price: cost,
      }])
    }
    setSelectedProduct(null); setQtyInput('1'); setCostInput('')
  }

  function handleProductSelect(id: string) {
    const p = products.find(p => p.id === id)
    if (p) { setSelectedProduct(p); setCostInput(String(p.cost_price)) }
    else setSelectedProduct(null)
  }

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.cost_price, 0)
  const detailRestock = restocks.find(r => r.id === detailId)

  return (
    <div className="space-y-5">
      {alert && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{alert.msg}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restock</h1>
          <p className="text-sm text-gray-500 mt-1">Catat pembelian stok baru dari supplier</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Catat Restock
        </button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : restocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Belum ada catatan restock.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nomor Restock</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Supplier</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Tanggal</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {restocks.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.restock_number}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{r.supplier_name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDateShort(r.created_at)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(r.total_amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailId(r.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Restock Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">Catat Restock Baru</h2>
              <button onClick={() => { setModalOpen(false); resetForm() }} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{formError}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier</label>
                  <input value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="PT. Sparepart Jaya" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Opsional..." />
                </div>
              </div>

              {/* Add Item */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Package className="h-4 w-4" /> Tambah Produk</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Produk</label>
                    <select
                      value={selectedProduct?.id ?? ''}
                      onChange={e => handleProductSelect(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                    >
                      <option value="">— Pilih Produk —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Harga Beli (Rp)</label>
                    <input
                      type="text"
                      value={formatCurrencyInput(costInput)}
                      onChange={e => setCostInput(parseCurrencyInput(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={qtyInput}
                        onChange={e => setQtyInput(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                      />
                      <button onClick={addItem} className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 whitespace-nowrap">+ Tambah</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item List */}
              {items.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Produk</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Qty</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Harga Beli</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Subtotal</th>
                        <th className="px-2 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(i => (
                        <tr key={i.product_id} className="border-b last:border-0">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-gray-900">{i.product_name}</p>
                            <p className="text-[11px] text-gray-400">{i.sku}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right">{i.quantity}</td>
                          <td className="px-3 py-2.5 text-right">{formatRupiah(i.cost_price)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{formatRupiah(i.quantity * i.cost_price)}</td>
                          <td className="px-2 py-2.5">
                            <button onClick={() => setItems(prev => prev.filter(x => x.product_id !== i.product_id))} className="text-gray-400 hover:text-red-500 p-1">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-3 py-2.5 text-right font-bold text-gray-700">TOTAL</td>
                        <td className="px-3 py-2.5 text-right font-bold text-primary">{formatRupiah(totalAmount)}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={() => { setModalOpen(false); resetForm() }} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button
                  onClick={() => { setFormError(''); if (items.length === 0) { setFormError('Tambahkan minimal 1 produk.'); return } saveMutation.mutate() }}
                  disabled={saveMutation.isPending || items.length === 0}
                  className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Restock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailId && detailRestock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <div>
                <h2 className="font-semibold text-gray-900">{detailRestock.restock_number}</h2>
                <p className="text-xs text-gray-400">{detailRestock.supplier_name ?? 'Supplier tidak dicatat'} · {formatDateShort(detailRestock.created_at)}</p>
              </div>
              <button onClick={() => setDetailId(null)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {detailItems.map((i: { id: string; quantity: number; cost_price: number; subtotal: number; products?: { name: string; sku: string } | null }) => (
                <div key={i.id} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{i.products?.name ?? '-'}</p>
                    <p className="text-xs text-gray-400">{i.products?.sku ?? ''} · {i.quantity} × {formatRupiah(i.cost_price)}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatRupiah(i.subtotal)}</p>
                </div>
              ))}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between font-bold">
                <span>TOTAL</span>
                <span className="text-primary">{formatRupiah(detailRestock.total_amount)}</span>
              </div>
              {detailRestock.notes && <p className="text-sm text-gray-500">Catatan: {detailRestock.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
