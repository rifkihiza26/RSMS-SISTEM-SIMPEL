import { useState, useEffect, useRef } from 'react'
import { Search, ShoppingCart, Plus, Minus, X, CheckCircle2, Calculator, Wrench, FileText, Printer, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// ... (Types & Interfaces) ...
type ItemType = 'PRODUCT' | 'SERVICE'

interface Product {
  id: string; name: string; sku: string; price: number; stock: number; category: string;
}
interface Service {
  id: string; name: string; code: string; price: number; category: string;
}
interface CartItem {
  id: string; type: ItemType; product_id?: string; service_id?: string;
  name: string; sku?: string; price: number; qty: number; is_service: boolean;
}
interface Mechanic {
  id: string; name: string; status: 'ACTIVE' | 'INACTIVE';
}
export function Cashier() {
  const { user } = useAuth()
  
  // Data States
  const [products, setProducts] = useState<Product[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  // UI States
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('PRODUCTS')
  const [loading, setLoading] = useState(true)

  // Session State (Multi-Tab Open Bills)
  interface Session {
    id: string;
    trxNumber: string;
    cart: CartItem[];
    mechanicId: string;
    motorType: string;
    hasUnsavedChanges: boolean;
    isSavedInDb: boolean;
  }
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')

  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'TRANSFER'|'QRIS'>('CASH')
  const [paidAmount, setPaidAmount] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [txError, setTxError] = useState('')

  // Completed State
  const [completedTx, setCompletedTx] = useState<any>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [prodRes, servRes, mechRes] = await Promise.all([
      supabase.from('products').select('*').eq('status', 'ACTIVE'),
      supabase.from('services').select('*').eq('status', 'ACTIVE'),
      supabase.from('mechanics').select('*').eq('status', 'ACTIVE'),
    ])
    
    if (prodRes.data) setProducts(prodRes.data)
    if (servRes.data) setServices(servRes.data)
    if (mechRes.data) setMechanics(mechRes.data)
    
    // Try to load Open Bills - gracefully handle if SQL not yet run
    try {
      const billRes = await supabase
        .from('transactions')
        .select('id, transaction_number, draft_cart, mechanic_id, motor_type, status')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: true })
      
      if (!billRes.error && billRes.data && billRes.data.length > 0) {
        const loadedSessions: Session[] = billRes.data.map(bill => ({
          id: bill.id,
          trxNumber: bill.transaction_number,
          cart: Array.isArray(bill.draft_cart) ? bill.draft_cart : [],
          mechanicId: bill.mechanic_id || '',
          motorType: bill.motor_type || '',
          hasUnsavedChanges: false,
          isSavedInDb: true
        }))
        setSessions(loadedSessions)
        setActiveSessionId(loadedSessions[0].id)
        setLoading(false)
        return
      }
    } catch (_) {
      // SQL not yet run - fall through to empty session
    }
    
    createNewSession()
    setLoading(false)
  }

  function createNewSession() {
    const id = crypto.randomUUID()
    const now = new Date()
    const trxNumber = 'TRX-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + Math.floor(Math.random() * 10000)
    
    const newSession: Session = {
      id, trxNumber, cart: [], mechanicId: '', motorType: '', hasUnsavedChanges: true, isSavedInDb: false
    }
    setSessions(prev => [...prev, newSession])
    setActiveSessionId(id)
  }

  const activeSession = sessions.find(s => s.id === activeSessionId)

  function updateActiveSession(updates: Partial<Session>) {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, ...updates, hasUnsavedChanges: true }
      }
      return s
    }))
  }

  // --- Cart Actions ---
  function addToCart(item: any, type: ItemType) {
    if (!activeSession) return
    const existing = activeSession.cart.find(c => type === 'PRODUCT' ? c.product_id === item.id : c.service_id === item.id)
    if (existing) {
      if (type === 'PRODUCT') {
        const prod = products.find(p => p.id === item.id)
        if (prod && existing.qty >= prod.stock) {
          alert('Stok tidak mencukupi!')
          return
        }
      }
      const newCart = activeSession.cart.map(c => c.id === existing.id ? { ...c, qty: c.qty + 1 } : c)
      updateActiveSession({ cart: newCart })
    } else {
      if (type === 'PRODUCT' && item.stock < 1) {
        alert('Stok habis!')
        return
      }
      const newItem: CartItem = {
        id: crypto.randomUUID(), type,
        product_id: type === 'PRODUCT' ? item.id : undefined,
        service_id: type === 'SERVICE' ? item.id : undefined,
        name: item.name, sku: type === 'PRODUCT' ? item.sku : undefined,
        price: item.price, qty: 1, is_service: type === 'SERVICE'
      }
      updateActiveSession({ cart: [...activeSession.cart, newItem] })
    }
  }

  function updateQty(id: string, delta: number) {
    if (!activeSession) return
    const item = activeSession.cart.find(c => c.id === id)
    if (!item) return
    const newQty = item.qty + delta
    if (newQty < 1) {
      updateActiveSession({ cart: activeSession.cart.filter(c => c.id !== id) })
      return
    }
    if (item.type === 'PRODUCT') {
      const prod = products.find(p => p.id === item.product_id)
      if (prod && newQty > prod.stock) {
        alert('Stok tidak mencukupi!')
        return
      }
    }
    updateActiveSession({ cart: activeSession.cart.map(c => c.id === id ? { ...c, qty: newQty } : c) })
  }

  // --- Open Bill Sync Logic ---
  async function saveOpenBill() {
    if (!activeSession) return
    if (activeSession.cart.length === 0) return alert('Keranjang kosong!')
    
    setProcessing(true)
    const cartJson = activeSession.cart.map(i => ({
      ...i, stock_tracked: i.type === 'PRODUCT'
    }))

    const { error } = await supabase.rpc('sync_open_bill', {
      p_tx_id: activeSession.id,
      p_tx_number: activeSession.trxNumber,
      p_mechanic_id: activeSession.mechanicId || null,
      p_motor_type: activeSession.motorType || '',
      p_new_cart: cartJson,
      p_created_by: user?.id
    })

    setProcessing(false)
    if (error) {
      alert('Gagal menyimpan bon: ' + error.message)
    } else {
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, hasUnsavedChanges: false, isSavedInDb: true } : s))
      // Refresh products to show deducted stock
      const { data } = await supabase.from('products').select('*').eq('status', 'ACTIVE')
      if (data) setProducts(data)
      alert('Bon berhasil disimpan & stok dibooking!')
    }
  }

  async function cancelOpenBill() {
    if (!activeSession) return
    if (!activeSession.isSavedInDb) {
      // Just close tab
      setSessions(prev => prev.filter(s => s.id !== activeSession.id))
      if (sessions.length > 1) setActiveSessionId(sessions.find(s => s.id !== activeSession.id)?.id || '')
      else createNewSession()
      return
    }

    if (!confirm('Batalkan bon ini? Stok akan dikembalikan.')) return

    setProcessing(true)
    const { error } = await supabase.rpc('cancel_open_bill', { p_tx_id: activeSession.id })
    setProcessing(false)
    
    if (error) {
      alert('Gagal membatalkan bon: ' + error.message)
    } else {
      setSessions(prev => prev.filter(s => s.id !== activeSession.id))
      if (sessions.length > 1) setActiveSessionId(sessions.find(s => s.id !== activeSession.id)?.id || '')
      else createNewSession()
      // Refresh stock
      const { data } = await supabase.from('products').select('*').eq('status', 'ACTIVE')
      if (data) setProducts(data)
    }
  }

  // --- Payment Logic ---
  async function finalizePayment() {
    if (!activeSession) return
    if (activeSession.cart.length === 0) return setTxError('Keranjang kosong.')
    const subtotal = activeSession.cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const total = subtotal - discount
    if (paymentMethod === 'CASH' && paidAmount < total) return setTxError('Uang pembayaran kurang.')
    
    setProcessing(true)
    setTxError('')

    const cartJson = activeSession.cart.map(i => ({
      item_type: i.type,
      product_id: i.product_id || null,
      service_id: i.service_id || null,
      item_name: i.name,
      sku: i.sku || null,
      quantity: i.qty,
      unit_price: i.price,
      subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT',
      is_service: i.is_service
    }))

    // 1. MUST SYNC FIRST to ensure stock is accurately deducted for this ID
    const { error: syncErr } = await supabase.rpc('sync_open_bill', {
      p_tx_id: activeSession.id, p_tx_number: activeSession.trxNumber, p_mechanic_id: activeSession.mechanicId || null,
      p_motor_type: activeSession.motorType || '', p_new_cart: cartJson, p_created_by: user?.id
    })
    
    if (syncErr) {
      setProcessing(false); return setTxError('Gagal sinkronisasi stok: ' + syncErr.message)
    }

    // 2. Process Payment
    const mechanicName = mechanics.find(m => m.id === activeSession.mechanicId)?.name || ''
    const notes = [mechanicName ? `Mekanik: ${mechanicName}` : '', activeSession.motorType ? `Motor: ${activeSession.motorType}` : ''].filter(Boolean).join(' | ')
    
    const finalPaid = paymentMethod === 'CASH' ? paidAmount : total
    const { error: payErr } = await supabase.rpc('pay_open_bill', {
      p_tx_id: activeSession.id,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: finalPaid,
      p_change_amount: paymentMethod === 'CASH' ? finalPaid - total : 0,
      p_notes: notes,
      p_items: cartJson
    })

    setProcessing(false)
    if (payErr) {
      setTxError('Gagal menyelesaikan pembayaran: ' + payErr.message)
    } else {
      // SUCCESS!
      setCompletedTx({
        trxNumber: activeSession.trxNumber,
        cart: activeSession.cart,
        subtotal, discount, total, paymentMethod, paidAmount: finalPaid, changeAmount: paymentMethod === 'CASH' ? finalPaid - total : 0,
        mechanicName, motorType: activeSession.motorType
      })
      setShowCheckout(false)
      
      // Remove from session
      setSessions(prev => prev.filter(s => s.id !== activeSession.id))
      // Refresh stock
      const { data } = await supabase.from('products').select('*').eq('status', 'ACTIVE')
      if (data) setProducts(data)
    }
  }

  // --- Print Logic ---
  function printReceipt() {
    const el = receiptRef.current
    if (!el) return
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '58mm'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.visibility = 'hidden'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(`<html><head><title>Struk</title><style>@page { size: 58mm auto; margin: 0; } body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }</style></head><body>${el.innerHTML}</body></html>`)
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 2000)
    }, 600)
  }

  // --- Filtering ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())))
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex h-full items-center justify-center p-8">Memuat Data...</div>

  // Render Completed View
  if (completedTx) {
    const now = new Date()
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="bg-green-500 p-6 text-center text-white">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-1">Transaksi Berhasil!</h2>
            <p className="text-green-100 opacity-90">{completedTx.trxNumber}</p>
          </div>
          <div className="p-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Total Tagihan</span><span className="font-bold">Rp {completedTx.total.toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Metode Pembayaran</span><span className="font-semibold">{completedTx.paymentMethod}</span></div>
              {completedTx.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between"><span className="text-gray-500">Dibayar</span><span className="font-semibold">Rp {completedTx.paidAmount.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-semibold text-green-600">Rp {completedTx.changeAmount.toLocaleString('id-ID')}</span></div>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCompletedTx(null); createNewSession() }} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200">Transaksi Baru</button>
              <button onClick={printReceipt} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90"><Printer className="h-4 w-4" /> Cetak Struk</button>
            </div>
          </div>
          {/* HIDDEN RECEIPT */}
          <div ref={receiptRef} id="receipt-pdf" className="hidden" style={{background:'white', padding:'4px', maxWidth:'58mm', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
            <div style={{textAlign:'center'}}>
              <img src="/logo-struk.jpg" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
              <div style={{fontWeight:'bold', fontSize:'14px', marginBottom:'2px'}}>RSMS</div>
              <div style={{fontSize:'11px', marginBottom:'2px'}}>Rakyat Sinting Matic Shop</div>
              <div style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}}></div>
            </div>
            <div style={{fontSize:'11px', marginBottom:'6px'}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span>Tgl:</span><span>{now.toLocaleDateString('id-ID')} {now.toLocaleTimeString('id-ID')}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span>No:</span><span>{completedTx.trxNumber}</span></div>
              {completedTx.mechanicName && <div style={{display:'flex', justifyContent:'space-between'}}><span>Mekanik:</span><span>{completedTx.mechanicName}</span></div>}
              {completedTx.motorType && <div style={{display:'flex', justifyContent:'space-between'}}><span>Motor:</span><span>{completedTx.motorType}</span></div>}
            </div>
            <div style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}}></div>
            <div>
              {completedTx.cart.map((item: any, i: number) => (
                <div key={i} style={{marginBottom:'4px'}}>
                  <div style={{marginBottom:'2px'}}>{item.name}</div>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}>
                    <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                    <span>{(item.qty * item.price).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}}></div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal:</span><span>{completedTx.subtotal.toLocaleString('id-ID')}</span></div>
            {completedTx.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon:</span><span>-{completedTx.discount.toLocaleString('id-ID')}</span></div>}
            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'14px', margin:'6px 0'}}><span>TOTAL:</span><span>{completedTx.total.toLocaleString('id-ID')}</span></div>
            <div style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}}></div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'2px'}}><span>Bayar ({completedTx.paymentMethod}):</span><span>{completedTx.paidAmount.toLocaleString('id-ID')}</span></div>
            {completedTx.paymentMethod === 'CASH' && <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px'}}><span>Kembali:</span><span>{completedTx.changeAmount.toLocaleString('id-ID')}</span></div>}
            <div style={{textAlign:'center', marginTop:'12px', fontSize:'11px'}}>
              <div style={{fontWeight:'bold'}}>Terima Kasih</div>
              <div>Barang yang sudah dibeli</div>
              <div>tidak dapat ditukar/dikembalikan</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = activeSession?.cart.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0
  const total = subtotal - discount

  return (
    <div className="flex h-full bg-gray-50 flex-col md:flex-row">
      {/* Left Area - Products & Services */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Cari barang atau jasa..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'PRODUCTS' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Produk</button>
            <button onClick={() => setActiveTab('SERVICES')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'SERVICES' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-900'}`}>Jasa</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeTab === 'PRODUCTS' ? filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p, 'PRODUCT')} className={`bg-white p-4 rounded-xl border-2 ${p.stock > 0 ? 'border-transparent hover:border-primary cursor-pointer' : 'border-gray-200 opacity-60 cursor-not-allowed'} transition-all shadow-sm flex flex-col h-full`}>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.sku}</p>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-primary">Rp {p.price.toLocaleString('id-ID')}</p>
                    <p className={`text-xs font-medium ${p.stock > 10 ? 'text-green-600' : p.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                      Stok: {p.stock}
                    </p>
                  </div>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${p.stock > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )) : filteredServices.map(s => (
              <div key={s.id} onClick={() => addToCart(s, 'SERVICE')} className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-primary cursor-pointer transition-all shadow-sm flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{s.name}</h3>
                  <p className="text-xs text-gray-500">{s.code}</p>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-lg font-bold text-primary">Rp {s.price.toLocaleString('id-ID')}</p>
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-5 w-5" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Area - Open Bills & Cart */}
      <div className="w-full md:w-[420px] bg-white flex flex-col border-l shadow-2xl relative z-10">
        
        {/* Open Bills Tabs */}
        <div className="bg-gray-800 text-white flex overflow-x-auto p-2 gap-2 hide-scrollbar">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => setActiveSessionId(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${s.id === activeSessionId ? 'bg-primary text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {s.hasUnsavedChanges && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>}
              <span className="font-semibold">{s.trxNumber.split('-').pop()}</span>
              {s.id === activeSessionId && sessions.length > 1 && !s.isSavedInDb && (
                <X className="h-4 w-4 ml-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); cancelOpenBill(); }} />
              )}
            </button>
          ))}
          <button onClick={createNewSession} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 transition-colors">
            <Plus className="h-4 w-4" /> Bon Baru
          </button>
        </div>

        {activeSession ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header info */}
            <div className="p-4 border-b bg-gray-50/50">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="font-semibold text-gray-700">{activeSession.trxNumber}</span>
                {activeSession.isSavedInDb ? (
                  <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">Tersimpan di DB</span>
                ) : (
                  <span className="ml-auto text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-medium">Draft Belum Disimpan</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Wrench className="h-3 w-3" /> Mekanik</label>
                  <select value={activeSession.mechanicId} onChange={e => updateActiveSession({ mechanicId: e.target.value })} className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary">
                    <option value="">-- Pilih --</option>
                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Motor</label>
                  <input type="text" placeholder="Contoh: Vario 150" value={activeSession.motorType} onChange={e => updateActiveSession({ motorType: e.target.value })} className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary focus:ring-primary" />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {activeSession.cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full"><ShoppingCart className="h-8 w-8" /></div>
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                </div>
              ) : (
                activeSession.cart.map((item) => (
                  <div key={item.id} className="flex items-start justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex-1 pr-3">
                      <h4 className="font-medium text-sm text-gray-900 leading-snug">{item.name}</h4>
                      <p className="text-primary font-bold text-sm mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Minus className="h-4 w-4" /></button>
                      <span className="w-6 text-center font-semibold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions & Checkout */}
            <div className="p-4 bg-white border-t space-y-4">
              
              <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                <span>Total Tagihan:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={saveOpenBill} disabled={processing || activeSession.cart.length === 0 || (!activeSession.hasUnsavedChanges && activeSession.isSavedInDb)}
                  className="w-full py-2.5 px-4 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  <Save className="h-4 w-4" /> Simpan Bon
                </button>
                <button onClick={cancelOpenBill} disabled={processing}
                  className="w-full py-2.5 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                  <Trash2 className="h-4 w-4" /> Batal / Hapus
                </button>
              </div>

              <button onClick={() => setShowCheckout(true)} disabled={processing || activeSession.cart.length === 0}
                className="w-full bg-primary text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-transform active:scale-[0.98]">
                <CheckCircle2 className="h-5 w-5" /> BAYAR LUNAS (Rp {subtotal.toLocaleString('id-ID')})
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Checkout Modal */}
      {showCheckout && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-primary text-white flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2"><Calculator className="h-5 w-5" /> Selesaikan Pembayaran</h2>
              <button onClick={() => setShowCheckout(false)} className="p-1 hover:bg-white/20 rounded-lg"><X className="h-6 w-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {txError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{txError}</div>}
              
              {activeSession.hasUnsavedChanges && (
                <div className="mb-4 bg-orange-50 text-orange-700 p-3 rounded-lg text-sm border border-orange-200">
                  Ada perubahan yang belum disimpan. Sistem akan menyimpan & membooking stok secara otomatis saat dibayar.
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl mb-6 space-y-2 border">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Diskon</span>
                  <div className="flex items-center gap-1">Rp <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 text-right p-1 border rounded" /></div>
                </div>
                <div className="pt-2 border-t flex justify-between font-bold text-lg text-gray-900"><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['CASH', 'TRANSFER', 'QRIS'].map((m) => (
                      <button key={m} onClick={() => setPaymentMethod(m as any)} className={`py-2 rounded-lg text-sm font-bold border-2 transition-all ${paymentMethod === m ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>{m}</button>
                    ))}
                  </div>
                </div>

                {paymentMethod === 'CASH' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Uang Diterima (Rp)</label>
                    <input type="number" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} className="w-full text-lg font-bold p-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:ring-0 transition-colors" placeholder="0" />
                    
                    <div className="flex gap-2 mt-2">
                      {[10000, 20000, 50000, 100000].map(amt => (
                        <button key={amt} onClick={() => setPaidAmount(prev => (prev||0) + amt)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-1.5 rounded-lg text-xs font-semibold text-gray-600">+{amt / 1000}k</button>
                      ))}
                      <button onClick={() => setPaidAmount(total)} className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 py-1.5 rounded-lg text-xs font-bold">PAS</button>
                    </div>

                    {paidAmount > 0 && (
                      <div className="mt-4 p-4 rounded-xl bg-gray-50 border flex justify-between items-center">
                        <span className="font-semibold text-gray-500">Kembalian:</span>
                        <span className={`text-xl font-bold ${paidAmount >= total ? 'text-green-600' : 'text-red-500'}`}>Rp {(paidAmount - total).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button onClick={finalizePayment} disabled={processing || (paymentMethod === 'CASH' && paidAmount < total)}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all">
                {processing ? 'Memproses...' : 'SELESAIKAN PEMBAYARAN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
