import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, generateTransactionNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { downloadPDF, shareViaWhatsApp } from '@/lib/pdf'
import { Search, Plus, Trash2, X, CheckCircle2, Printer, ShoppingCart, Package, Wrench, Download, MessageCircle } from 'lucide-react'

const SHOP_NAME = 'RAKYAT SINTING MATIC SHOP'
const SHOP_ADDRESS = 'Jln. Pejaten Raya RT.01/RW.07 No. 3, Kel. Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan 12510'
const SHOP_PHONE = '0813-8760-7676'

type CartItem = {
  id: string
  name: string
  type: 'PRODUCT' | 'SERVICE' | 'MANUAL'
  price: number
  qty: number
  product_id?: string
  service_id?: string
  sku?: string
  max_stock?: number
}

type Product = { id: string; sku: string; name: string; selling_price: number; stock: number; brand: string | null; product_categories?: { name: string } | { name: string }[] | null }
type Service = { id: string; service_code: string; name: string; selling_price: number }
type Mechanic = { id: string; name: string }

type CompletedTransaction = {
  transaction_number: string
  total: number
  subtotal: number
  discount: number
  payment_method: string
  change_amount: number
  items: CartItem[]
  mechanic_name: string
  motor_type: string
}

export function Cashier() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'TRANSFER'>('CASH')
  const [paidAmount, setPaidAmount] = useState(0)
  const [selectedMechanicId, setSelectedMechanicId] = useState('')
  const [motorType, setMotorType] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState({ name: '', type: 'Jasa', price: '', qty: '1' })
  const [manualError, setManualError] = useState('')
  const [stockWarning, setStockWarning] = useState('')
  const [completed, setCompleted] = useState<CompletedTransaction | null>(null)
  const [processing, setProcessing] = useState(false)
  const [txError, setTxError] = useState('')
  const receiptRef = useRef<HTMLDivElement>(null)

  const { data: products = [] } = useQuery({
    queryKey: ['cashier-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id,sku,name,selling_price,stock,brand,product_categories(name)').eq('status', 'ACTIVE').order('name')
      return (data ?? []) as Product[]
    }
  })

  const { data: services = [] } = useQuery({
    queryKey: ['cashier-services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('id,service_code,name,selling_price').eq('active', true).order('name')
      return (data ?? []) as Service[]
    }
  })

  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mechanics').select('id,name').order('name')
      if (error) console.error("Mechanics Error:", error)
      return (data ?? []) as Mechanic[]
    }
  })

  // Kumpulkan daftar kategori unik dari produk
  const productCategories = ['Semua', ...Array.from(new Set(products.map(p => ((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) || '')).filter(Boolean)))]
  const serviceCategories = ['Semua']

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || categoryFilter === 'Semua' || ((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) === categoryFilter)
    return matchSearch && matchCategory
  })
  const filteredServices = services.filter((s: any) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.service_code.toLowerCase().includes(search.toLowerCase())
    const matchCategory = true
    return matchSearch && matchCategory
  })

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total = Math.max(0, subtotal - discount)
  const change = paymentMethod === 'CASH' ? Math.max(0, paidAmount - total) : 0

  function addProduct(p: Product) {
    setCart(prev => {
      const ex = prev.find(i => i.product_id === p.id)
      if (ex) {
        if (ex.qty >= (p.stock)) { setStockWarning(`Stok ${p.name} tidak mencukupi. Tersedia: ${p.stock}`); setTimeout(() => setStockWarning(''), 3000); return prev }
        return prev.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i)
      }
      if (p.stock === 0) { setStockWarning(`Stok ${p.name} habis.`); setTimeout(() => setStockWarning(''), 3000); return prev }
      return [...prev, { id: crypto.randomUUID(), name: p.name, type: 'PRODUCT', price: p.selling_price, qty: 1, product_id: p.id, sku: p.sku, max_stock: p.stock }]
    })
  }

  function addService(s: Service) {
    setCart(prev => {
      const ex = prev.find(i => i.service_id === s.id)
      if (ex) return prev.map(i => i.service_id === s.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: crypto.randomUUID(), name: s.name, type: 'SERVICE', price: s.selling_price, qty: 1, service_id: s.id, sku: s.service_code }]
    })
  }

  function changeQty(id: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i
      const newQty = i.qty + delta
      if (newQty < 1) return i
      if (i.type === 'PRODUCT' && i.max_stock !== undefined && newQty > i.max_stock) {
        setStockWarning(`Stok ${i.name} tidak mencukupi. Tersedia: ${i.max_stock}`)
        setTimeout(() => setStockWarning(''), 3000)
        return i
      }
      return { ...i, qty: newQty }
    }))
  }

  function removeItem(id: string) { setCart(prev => prev.filter(i => i.id !== id)) }

  function addManual(e: React.FormEvent) {
    e.preventDefault(); setManualError('')
    if (!manualForm.name.trim()) return setManualError('Nama item wajib diisi.')
    const price = parseFloat(manualForm.price)
    const qty = manualForm.type === 'Jasa' ? 1 : parseInt(manualForm.qty)
    if (!price || price <= 0) return setManualError('Harga harus lebih dari 0.')
    if (!qty || qty < 1) return setManualError('Quantity harus minimal 1.')
    setCart(prev => [...prev, { id: crypto.randomUUID(), name: manualForm.name.trim(), type: 'MANUAL', price, qty }])
    setManualForm({ name: '', type: 'Jasa', price: '', qty: '1' })
    setManualOpen(false)
  }

  async function completeTransaction() {
    if (cart.length === 0) return setTxError('Keranjang masih kosong.')
    if (paymentMethod === 'CASH' && paidAmount < total) return setTxError('Uang yang dibayarkan kurang dari total belanja.')
    setTxError(''); setProcessing(true)
    const trxNumber = generateTransactionNumber()
    const paid = paymentMethod === 'CASH' ? paidAmount : total
    const items = cart.map(i => ({
      item_type: i.type,
      product_id: i.product_id ?? null,
      service_id: i.service_id ?? null,
      item_name: i.name,
      sku: i.sku ?? null,
      quantity: i.qty,
      unit_price: i.price,
      subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT',
    }))
    const { error } = await supabase.rpc('process_transaction', {
      p_transaction_number: trxNumber,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paid,
      p_change_amount: paymentMethod === 'CASH' ? paid - total : 0,
      p_cash_session_id: null,
      p_notes: [
        selectedMechanicId ? `Mekanik: ${mechanics.find(m => m.id === selectedMechanicId)?.name ?? ''}` : '',
        motorType ? `Motor: ${motorType}` : ''
      ].filter(Boolean).join(' | ') || '',
      p_created_by: user?.id ?? null,
      p_items: items,
    })
    
    if (!error && txDate !== new Date().toISOString().split('T')[0]) {
      const targetTime = txDate + 'T12:00:00Z'
      const { data: trxData } = await supabase.from('transactions').select('id').eq('transaction_number', trxNumber).single()
      if (trxData) {
        await Promise.all([
          supabase.from('transactions').update({ created_at: targetTime }).eq('id', trxData.id),
          supabase.from('transaction_items').update({ created_at: targetTime }).eq('transaction_id', trxData.id),
          supabase.from('incomes').update({ created_at: targetTime, date: txDate }).eq('transaction_id', trxData.id)
        ])
      }
    }

    setProcessing(false)
    if (error) {
      const msg = error.message.includes('Stok tidak mencukupi') ? error.message : `Transaksi gagal: ${error.message}`
      return setTxError(msg)
    }
    qc.invalidateQueries({ queryKey: ['cashier-products'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    const mechName = mechanics.find(m => m.id === selectedMechanicId)?.name ?? '-'
    setCompleted({ transaction_number: trxNumber, total, subtotal, discount, payment_method: paymentMethod, change_amount: paymentMethod === 'CASH' ? paid - total : 0, items: cart, mechanic_name: mechName, motor_type: motorType })
  }

  function resetTransaction() {
    setCart([]); setDiscount(0); setPaidAmount(0); setPaymentMethod('CASH')
    setCompleted(null); setTxError(''); setSelectedMechanicId(''); setMotorType('')
    setTxDate(new Date().toISOString().split('T')[0])
  }

  function printReceipt() {
    const el = receiptRef.current
    if (!el) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Struk - ${SHOP_NAME}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size: 12px; background: #fff; color: #000; max-width: 320px; margin: 0 auto; padding: 16px; }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: bold; }
      .small { font-size: 10px; }
      .separator { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      .separator-solid { border: none; border-top: 2px solid #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; margin-bottom: 2px; }
      .row-item-name { flex: 1; }
      .row-item-price { white-space: nowrap; }
      .logo { width: 140px; height: auto; object-fit: contain; margin: 0 auto 6px; display: block; }
      .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
      .badge { display: inline-block; border: 1px solid #000; padding: 1px 4px; font-size: 9px; border-radius: 2px; margin-left: 4px; }
      .footer-msg { margin-top: 12px; font-size: 11px; }
    </style>
    </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  if (completed) {
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    return (
      <div className="max-w-md mx-auto space-y-5">
        <div className="bg-white border rounded-xl shadow-sm p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Transaksi Berhasil!</h2>
          <p className="text-sm text-gray-500 mt-1">{completed.transaction_number}</p>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-gray-900">{formatRupiah(completed.total)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pembayaran</span><span className="font-medium">{completed.payment_method}</span></div>
            {completed.payment_method === 'CASH' && <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-bold text-green-600">{formatRupiah(completed.change_amount)}</span></div>}
            {completed.motor_type && <div className="flex justify-between"><span className="text-gray-500">Jenis Motor</span><span className="font-medium">{completed.motor_type}</span></div>}
            {completed.mechanic_name !== '-' && <div className="flex justify-between"><span className="text-gray-500">Mekanik</span><span className="font-medium">{completed.mechanic_name}</span></div>}
          </div>
          <div className="flex gap-2 mt-6 flex-wrap">
            <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Printer className="h-4 w-4" /> Cetak Struk
            </button>
            <button
              onClick={() => downloadPDF('receipt-pdf', `Struk-${completed.transaction_number}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800"
            >
              <Download className="h-4 w-4" /> Download PDF
            </button>
          </div>
          <button
            onClick={() => shareViaWhatsApp(undefined, `Halo! Berikut struk transaksi ${completed.transaction_number} dari Rakyat Sinting Matic Shop 🏍️\nTotal: ${formatRupiah(completed.total)}\nMetode: ${completed.payment_method}${completed.mechanic_name !== '-' ? `\nMekanik: ${completed.mechanic_name}` : ''}\n\nTerima kasih sudah mempercayakan kendaraan Anda kepada kami! 🙏`)}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700"
          >
            <MessageCircle className="h-4 w-4" /> Kirim via WhatsApp
          </button>
          <button onClick={resetTransaction} className="w-full mt-2 bg-primary text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90">
            Transaksi Baru
          </button>
        </div>

        {/* Hidden receipt for print */}
        <div ref={receiptRef} id="receipt-pdf" className="hidden" style={{background:'white', padding:'16px', maxWidth:'320px', fontFamily:'monospace', fontSize:'12px'}}>
          {/* Header */}
          <div className="center">
            <img src="/logo.png" alt="Logo" className="logo" />
            <div className="bold" style={{fontSize:'13px'}}>{SHOP_NAME}</div>
            <div className="small" style={{marginTop:'3px', lineHeight:'1.5'}}>{SHOP_ADDRESS}</div>
            <div className="small">WA / Telp: {SHOP_PHONE}</div>
          </div>
          <hr className="separator-solid" />

          {/* Transaction Info */}
          <div className="row"><span className="bold">No. Transaksi:</span><span>{completed.transaction_number}</span></div>
          <div className="row"><span>Tanggal:</span><span>{dateStr}</span></div>
          <div className="row"><span>Jam:</span><span>{timeStr}</span></div>
          {completed.motor_type && <div className="row"><span>Motor:</span><span className="bold">{completed.motor_type}</span></div>}
            {completed.mechanic_name !== '-' && <div className="row"><span>Mekanik:</span><span className="bold">{completed.mechanic_name}</span></div>}
          <hr className="separator" />

          {/* Items */}
          <div className="bold small" style={{marginBottom:'4px'}}>ITEM PEMBELIAN</div>
          {completed.items.map(i => (
            <div key={i.id} style={{marginBottom:'5px'}}>
              <div className="row-item-name bold" style={{fontSize:'11px'}}>{i.name}</div>
              <div className="row">
                <span className="small">{i.qty} × {formatRupiah(i.price)}</span>
                <span className="small bold">{formatRupiah(i.price * i.qty)}</span>
              </div>
            </div>
          ))}
          <hr className="separator" />

          {/* Totals */}
          <div className="row"><span>Subtotal</span><span>{formatRupiah(completed.subtotal)}</span></div>
          {completed.discount > 0 && <div className="row"><span>Diskon</span><span>-{formatRupiah(completed.discount)}</span></div>}
          <hr className="separator" />
          <div className="total-row"><span>TOTAL</span><span>{formatRupiah(completed.total)}</span></div>
          <hr className="separator" />

          {/* Payment */}
          <div className="row"><span>Metode Bayar</span><span className="bold">{completed.payment_method}</span></div>
          {completed.payment_method === 'CASH' && <>
            <div className="row"><span>Uang Diterima</span><span>{formatRupiah(completed.total + completed.change_amount)}</span></div>
            <div className="row"><span>Kembalian</span><span className="bold">{formatRupiah(completed.change_amount)}</span></div>
          </>}
          <hr className="separator-solid" />

          {/* Footer */}
          <div className="center footer-msg">
            <div>Terima kasih telah mempercayakan</div>
            <div>kendaraan Anda kepada kami!</div>
            <div style={{marginTop:'6px', fontWeight:'bold'}}>— Rakyat Sinting Matic Shop —</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Left: Search + Items */}
      <div className="flex-1 space-y-3 min-w-0">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 shadow-sm">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Cari produk atau jasa..." className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setManualOpen(true)} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> Input Manual
          </button>
        </div>

        {stockWarning && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm">{stockWarning}</div>}

        <div className="flex gap-2">
          <button onClick={() => { setTab('PRODUCT'); setCategoryFilter('') }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'PRODUCT' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <Package className="h-4 w-4" /> Produk
          </button>
          <button onClick={() => { setTab('SERVICE'); setCategoryFilter('') }} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${tab === 'SERVICE' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
            <Wrench className="h-4 w-4" /> Jasa
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(tab === 'PRODUCT' ? productCategories : serviceCategories).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === 'Semua' ? '' : (cat || ''))}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                (cat === 'Semua' && !categoryFilter) || categoryFilter === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:max-h-[calc(100vh-160px)] overflow-y-auto pr-1 pb-4">
          {tab === 'PRODUCT' ? (
            filteredProducts.length === 0 ? <div className="col-span-full text-center py-8 text-gray-400 text-sm">Produk tidak ditemukan</div> :
            filteredProducts.map(p => (
              <button key={p.id} onClick={() => addProduct(p)} disabled={p.stock === 0}
                className={`text-left bg-white border rounded-xl p-3 shadow-sm hover:border-primary hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">PRODUK</span>
                <p className="font-semibold text-gray-900 text-sm mt-1.5 leading-tight line-clamp-2">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">{formatRupiah(p.selling_price)}</p>
                <p className={`text-xs mt-0.5 ${p.stock === 0 ? 'text-red-500' : p.stock <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>Stok: {p.stock}</p>
              </button>
            ))
          ) : (
            filteredServices.length === 0 ? <div className="col-span-full text-center py-8 text-gray-400 text-sm">Jasa tidak ditemukan</div> :
            filteredServices.map(s => (
              <button key={s.id} onClick={() => addService(s)} className="text-left bg-white border rounded-xl p-3 shadow-sm hover:border-blue-500 hover:shadow-md transition-all">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">JASA</span>
                <p className="font-semibold text-gray-900 text-sm mt-1.5 leading-tight line-clamp-2">{s.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.service_code}</p>
                <p className="text-sm font-bold text-gray-900 mt-2">{formatRupiah(s.selling_price)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Cart + Payment */}
      <div className="bg-white border rounded-xl shadow-sm flex flex-col h-fit md:h-[calc(100vh-100px)] sticky top-4 w-full md:w-80 xl:w-96 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3.5 border-b">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <ShoppingCart className="h-4 w-4" /> Keranjang
          </div>
          {cart.length > 0 && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[200px] md:min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Keranjang kosong</div>
          ) : cart.map(item => (
            <div key={item.id} className="border rounded-lg p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                      item.type === 'PRODUCT' ? 'bg-primary/10 text-primary' :
                      item.type === 'SERVICE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>{item.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{formatRupiah(item.price)}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0 p-0.5">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-gray-100">−</button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded border text-xs flex items-center justify-center hover:bg-gray-100">+</button>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatRupiah(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t space-y-2">
          {/* Date input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tanggal</span>
            <input
              type="date"
              value={txDate}
              onChange={e => setTxDate(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]"
            />
          </div>

          {/* Motor input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Jenis Motor</span>
            <input
              type="text"
              placeholder="Vario 125, Beat, dll..."
              value={motorType}
              onChange={e => setMotorType(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]"
            />
          </div>

          {/* Mechanic selector */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Mekanik</span>
            <select
              value={selectedMechanicId}
              onChange={e => setSelectedMechanicId(e.target.value)}
              className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]"
            >
              <option value="">— Pilih Mekanik —</option>
              {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span><span>{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Diskon (Rp)</span>
            <input type="text" value={discount ? formatCurrencyInput(discount) : ""} placeholder="0"
              onChange={e => setDiscount(parseFloat(parseCurrencyInput(e.target.value)) || 0)}
              className="w-28 text-right border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>TOTAL</span><span className="text-primary">{formatRupiah(total)}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(['CASH', 'QRIS', 'TRANSFER'] as const).map(m => (
              <button key={m} onClick={() => { setPaymentMethod(m); if (m !== 'CASH') setPaidAmount(total) }}
                className={`py-2 rounded-lg text-xs font-bold border transition-colors ${paymentMethod === m ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {m}
              </button>
            ))}
          </div>

          {paymentMethod === 'CASH' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uang Dibayar</span>
                <input type="text" value={paidAmount ? formatCurrencyInput(paidAmount) : ""}
                  onChange={e => setPaidAmount(parseFloat(parseCurrencyInput(e.target.value)) || 0)}
                  className="w-32 text-right border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Kembalian</span>
                <span className={`font-semibold ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatRupiah(change)}</span>
              </div>
            </div>
          )}

          {txError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">{txError}</div>}

          <button onClick={completeTransaction} disabled={processing || cart.length === 0}
            className="w-full bg-primary text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
            <CheckCircle2 className="h-4 w-4" />
            {processing ? 'Memproses...' : 'SELESAIKAN TRANSAKSI'}
          </button>
        </div>
      </div>

      {/* Manual Input Modal */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Input Item Manual</h2>
              <button onClick={() => setManualOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addManual} className="p-5 space-y-4">
              {manualError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{manualError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item <span className="text-red-500">*</span></label>
                <input value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Nama barang atau jasa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <select value={manualForm.type} onChange={e => setManualForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="Jasa">Jasa</option>
                  <option value="Barang">Barang</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {manualForm.type === 'Barang' ? '⚠️ Item manual tidak terhubung dengan stok produk.' : 'Item manual tidak terhubung dengan daftar jasa.'}
                </p>
              </div>
              <div className={`grid ${manualForm.type === 'Barang' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
                  <input type="text" value={formatCurrencyInput(manualForm.price)} onChange={e => setManualForm(f => ({ ...f, price: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                {manualForm.type === 'Barang' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                    <input type="number" min="1" value={manualForm.qty} onChange={e => setManualForm(f => ({ ...f, qty: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                )}
              </div>
              {manualForm.price && manualForm.qty && (
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{formatRupiah((parseFloat(manualForm.price) || 0) * (parseInt(manualForm.qty) || 0))}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={() => setManualOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Tambahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
