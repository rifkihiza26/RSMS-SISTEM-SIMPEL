import { useState, useRef, useEffect } from 'react'
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
  is_service: boolean
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

// --- Per-session state ---
type CartSession = {
  id: string
  name?: string
  label?: string
  cart: CartItem[]
  motorType: string
  selectedMechanicId: string
  txError: string
  txDate: string
  discount: number
  paymentMethod: 'CASH' | 'TRANSFER' | 'QRIS'
  paidAmount: number
  showWaInput?: boolean
  waCustomerPhone?: string
  completed?: CompletedTransaction | null
  isSavedInDb?: boolean
  trxNumber?: string
}

function newSession(index: number): CartSession {
  return {
    id: crypto.randomUUID(),
    label: `Antrian ${index}`,
    cart: [],
    discount: 0,
    paymentMethod: 'CASH',
    paidAmount: 0,
    selectedMechanicId: '',
    motorType: '',
    txDate: new Date().toISOString().split('T')[0],
    txError: '',
    completed: null,
    showWaInput: false,
    waCustomerPhone: '',
  }
}

export function Cashier() {
  const { user } = useAuth()
  const qc = useQueryClient()

  // Global UI state
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState([{ id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }])
  const [manualError, setManualError] = useState('')
  const [stockWarning, setStockWarning] = useState('')
  const [processing, setProcessing] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Multi-session state - persisted to localStorage
  const STORAGE_KEY = 'rsms_cashier_sessions'
  const ACTIVE_KEY = 'rsms_cashier_active'

  const [sessions, setSessions] = useState<CartSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as CartSession[]
        // Filter out completed sessions on reload
        const pending = parsed.filter(s => !s.completed)
        if (pending.length > 0) return pending
      }
    } catch {}
    const first = newSession(1)
    return [first]
  })

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const activeId = localStorage.getItem(ACTIVE_KEY)
      if (saved && activeId) {
        const parsed = JSON.parse(saved) as CartSession[]
        const pending = parsed.filter(s => !s.completed)
        if (pending.find(s => s.id === activeId)) return activeId
        if (pending.length > 0) return pending[0].id
      }
    } catch {}
    return ''
  })

  // Auto-save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      // Only persist non-completed sessions
      const toSave = sessions.map(s => s.completed ? { ...s, completed: null } : s)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      localStorage.setItem(ACTIVE_KEY, activeSessionId)
    } catch {}
  }, [sessions, activeSessionId])

  // Init: make sure activeSessionId matches first session
  const activeSession = sessions.find(s => s.id === activeSessionId) ?? sessions[0]

  function updateSession(patch: Partial<CartSession>) {
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, ...patch } : s))
  }

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

  const productCategories = ['Semua', ...Array.from(new Set(products.map(p => ((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) || '')).filter(Boolean)))]
  const serviceCategories = ['Semua']

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || categoryFilter === 'Semua' || ((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) === categoryFilter)
    return matchSearch && matchCategory
  })
  const filteredServices = services.filter((s: any) => {
    return s.name.toLowerCase().includes(search.toLowerCase()) || s.service_code.toLowerCase().includes(search.toLowerCase())
  })

  const { cart, discount, paymentMethod, paidAmount, selectedMechanicId, motorType, txDate, txError, completed, showWaInput, waCustomerPhone } = activeSession
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const total = Math.max(0, subtotal - discount)
  const change = paymentMethod === 'CASH' ? Math.max(0, paidAmount - total) : 0

  // --- Session management ---
  function addSession() {
    if (sessions.length >= 5) return
    const next = newSession(sessions.length + 1)
    setSessions(prev => [...prev, next])
    setActiveSessionId(next.id)
  }

  function removeSession(id: string) {
    if (sessions.length === 1) {
      const fresh = newSession(1)
      setSessions([fresh])
      setActiveSessionId(fresh.id)
      return
    }
    const idx = sessions.findIndex(s => s.id === id)
    const newSessions = sessions.filter(s => s.id !== id)
    setSessions(newSessions)
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[Math.max(0, idx - 1)].id)
    }
  }

  // --- Cart operations ---
  function addProduct(p: Product) {
    const newCart = [...cart]
    const ex = newCart.find(i => i.product_id === p.id)
    if (ex) {
      if (ex.qty >= p.stock) { setStockWarning(`Stok ${p.name} tidak mencukupi. Tersedia: ${p.stock}`); setTimeout(() => setStockWarning(''), 3000); return }
      updateSession({ cart: newCart.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i) })
    } else {
      if (p.stock === 0) { setStockWarning(`Stok ${p.name} habis.`); setTimeout(() => setStockWarning(''), 3000); return }
      updateSession({ cart: [...cart, { id: crypto.randomUUID(), name: p.name, type: 'PRODUCT', price: p.selling_price, qty: 1, product_id: p.id, sku: p.sku, max_stock: p.stock, is_service: false }] })
    }
  }

  function addService(s: Service) {
    const ex = cart.find(i => i.service_id === s.id)
    if (ex) {
      updateSession({ cart: cart.map(i => i.service_id === s.id ? { ...i, qty: i.qty + 1 } : i) })
    } else {
      updateSession({ cart: [...cart, { id: crypto.randomUUID(), name: s.name, type: 'SERVICE', price: s.selling_price, qty: 1, service_id: s.id, sku: s.service_code, is_service: true }] })
    }
  }

  function changeQty(id: string, delta: number) {
    updateSession({
      cart: cart.map(i => {
        if (i.id !== id) return i
        const newQty = i.qty + delta
        if (newQty < 1) return i
        if (i.type === 'PRODUCT' && i.max_stock !== undefined && newQty > i.max_stock) {
          setStockWarning(`Stok ${i.name} tidak mencukupi. Tersedia: ${i.max_stock}`)
          setTimeout(() => setStockWarning(''), 3000)
          return i
        }
        return { ...i, qty: newQty }
      })
    })
  }

  function removeItem(id: string) { updateSession({ cart: cart.filter(i => i.id !== id) }) }

  function addManual(e: React.FormEvent) {
    e.preventDefault(); setManualError('');
    
    const newItems = [];
    for (const item of manualForm) {
      if (!item.name.trim()) return setManualError('Ada item yang belum memiliki nama.');
      const price = parseFloat(item.price);
      const qty = item.type === 'Jasa' ? 1 : parseInt(item.qty);
      if (!price || price <= 0) return setManualError('Ada item dengan harga tidak valid.');
      if (!qty || qty < 1) return setManualError('Quantity harus minimal 1.');
      
      newItems.push({
        id: crypto.randomUUID(),
        name: item.name.trim(),
        type: 'MANUAL' as const,
        price,
        qty,
        is_service: item.type === 'Jasa'
      });
    }

    updateSession({ cart: [...cart, ...newItems] });
    setManualForm([{ id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }]);
    setManualOpen(false);
  }
  
  function addManualRow() {
    setManualForm([...manualForm, { id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }]);
  }
  
  function removeManualRow(id: string) {
    if (manualForm.length === 1) return;
    setManualForm(manualForm.filter(item => item.id !== id));
  }
  
  function updateManualRow(id: string, field: string, value: string) {
    setManualForm(manualForm.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  async function completeTransaction() {
    if (cart.length === 0) return updateSession({ txError: 'Keranjang masih kosong.' })
    if (paymentMethod === 'CASH' && paidAmount < total) return updateSession({ txError: 'Uang yang dibayarkan kurang dari total belanja.' })
    updateSession({ txError: '' }); setProcessing(true)
    
    const session = activeSession
    const trxNumber = session.trxNumber || generateTransactionNumber()
    const paid = paymentMethod === 'CASH' ? paidAmount : total
    
    const cartJson = cart.map(i => ({
      item_type: i.type, product_id: i.product_id ?? null, service_id: i.service_id ?? null,
      item_name: i.name, sku: i.sku ?? null, quantity: i.qty, unit_price: i.price, subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT', is_service: i.is_service,
    }))

    const { error: syncErr } = await supabase.rpc('sync_open_bill', {
      p_tx_id: session.id, p_tx_number: trxNumber, p_mechanic_id: selectedMechanicId || null,
      p_motor_type: motorType || '', p_new_cart: cartJson, p_created_by: user?.id
    })

    if (syncErr) {
      setProcessing(false); return updateSession({ txError: 'Gagal sinkronisasi: ' + syncErr.message })
    }

    const mechanicName = mechanics.find(m => m.id === selectedMechanicId)?.name || ''
    const notes = [mechanicName ? `Mekanik: ${mechanicName}` : '', motorType ? `Motor: ${motorType}` : ''].filter(bool => bool).join(' | ')

    const { error } = await supabase.rpc('pay_open_bill', {
      p_tx_id: session.id,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paid,
      p_change_amount: paymentMethod === 'CASH' ? paid - total : 0,
      p_notes: notes,
      p_items: cartJson
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
      return updateSession({ txError: msg })
    }
    qc.invalidateQueries({ queryKey: ['cashier-products'] })
    qc.invalidateQueries({ queryKey: ['transactions'] })
    const mechName = mechanics.find(m => m.id === selectedMechanicId)?.name ?? '-'
    updateSession({
      completed: { transaction_number: trxNumber, total, subtotal, discount, payment_method: paymentMethod, change_amount: paymentMethod === 'CASH' ? paid - total : 0, items: cart, mechanic_name: mechName, motor_type: motorType }
    })
  }

  function resetSession() {
    const fresh = newSession(sessions.indexOf(activeSession) + 1)
    setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...fresh, id: s.id, label: s.label } : s))
  }

  function printReceipt() {
    const el = receiptRef.current
    if (!el) return
    
    // Create a hidden iframe
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
    doc.write(`<html><head><title>Struk</title>
    <style>
      @page { size: 58mm auto; margin: 0; }
      body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }
    </style>
    </head><body>
    ${el.innerHTML}
    </body></html>`)
    doc.close()

    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 2000)
    }, 600)
  }

  // --- Render completed view (inside cart panel) ---
  function renderCompleted(comp: CompletedTransaction) {
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <h3 className="font-bold text-gray-900">Transaksi Berhasil!</h3>
          <p className="text-xs text-gray-500 mt-0.5">{comp.transaction_number}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">{formatRupiah(comp.total)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Pembayaran</span><span>{comp.payment_method}</span></div>
          {comp.payment_method === 'CASH' && <div className="flex justify-between"><span className="text-gray-500">Kembalian</span><span className="font-bold text-green-600">{formatRupiah(comp.change_amount)}</span></div>}
          {comp.motor_type && <div className="flex justify-between"><span className="text-gray-500">Motor</span><span>{comp.motor_type}</span></div>}
          {comp.mechanic_name !== '-' && <div className="flex justify-between"><span className="text-gray-500">Mekanik</span><span>{comp.mechanic_name}</span></div>}
        </div>
        <div className="flex gap-2">
          <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-1.5 border rounded-lg py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Printer className="h-3.5 w-3.5" /> Cetak
          </button>
          <button onClick={() => downloadPDF('receipt-pdf', `Struk-${comp.transaction_number}`)} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-900 text-white border rounded-lg py-2 text-xs font-medium hover:bg-gray-800">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
        {showWaInput ? (
          <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
            <label className="block text-xs font-medium text-gray-700">Nomor WA Customer</label>
            <input type="text" placeholder="Contoh: 08123456789" value={waCustomerPhone} onChange={e => updateSession({ waCustomerPhone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => updateSession({ showWaInput: false })} className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-lg py-2 text-xs font-medium hover:bg-gray-100">Batal</button>
              <button onClick={async () => {
                if (!(waCustomerPhone || "").trim()) return alert('Masukkan nomor WA terlebih dahulu!')
                await downloadPDF('receipt-pdf', `Struk-${comp.transaction_number}`)
                shareViaWhatsApp(waCustomerPhone || "", `Halo! Berikut struk transaksi ${comp.transaction_number} dari Rakyat Sinting Matic Shop 🏍️\nTotal: ${formatRupiah(comp.total)}\nMetode: ${comp.payment_method}${comp.mechanic_name !== '-' ? `\nMekanik: ${comp.mechanic_name}` : ''}\n\nTerima kasih sudah mempercayakan kendaraan Anda kepada kami! 🙏`)
                updateSession({ showWaInput: false })
              }} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-green-700">Kirim WA</button>
            </div>
          </div>
        ) : (
          <button onClick={() => updateSession({ showWaInput: true })} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700">
            <MessageCircle className="h-4 w-4" /> Kirim via WhatsApp
          </button>
        )}
        <button onClick={resetSession} className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-bold hover:bg-primary/90">
          Transaksi Baru (Tab Ini)
        </button>

        {/* Hidden receipt */}
        <div ref={receiptRef} id="receipt-pdf" className="hidden" style={{background:'white', padding:'4px', maxWidth:'58mm', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
          <div style={{textAlign:'center'}}>
            <img src="/logo-struk.jpg" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
            <div style={{fontWeight:'bold', fontSize:'13px'}}>{SHOP_NAME}</div>
            <div style={{fontSize:'10px', marginTop:'3px', lineHeight:'1.5'}}>{SHOP_ADDRESS}</div>
            <div style={{fontSize:'10px'}}>WA / Telp: {SHOP_PHONE}</div>
          </div>
          <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span style={{fontWeight:'bold'}}>No. Transaksi:</span><span>{comp.transaction_number}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Tanggal:</span><span>{dateStr}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Jam:</span><span>{timeStr}</span></div>
          {comp.motor_type && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Motor:</span><span style={{fontWeight:'bold'}}>{comp.motor_type}</span></div>}
          {comp.mechanic_name !== '-' && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Mekanik:</span><span style={{fontWeight:'bold'}}>{comp.mechanic_name}</span></div>}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{fontWeight:'bold', fontSize:'10px', marginBottom:'4px'}}>ITEM PEMBELIAN</div>
          {comp.items.map(i => (
            <div key={i.id} style={{marginBottom:'5px'}}>
              <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'2px'}}>{i.name}</div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{fontSize:'11px'}}>{i.qty} × {formatRupiah(i.price)}</span>
                <span style={{fontSize:'11px', fontWeight:'bold'}}>{formatRupiah(i.price * i.qty)}</span>
              </div>
            </div>
          ))}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal</span><span>{formatRupiah(comp.subtotal)}</span></div>
          {comp.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon</span><span>-{formatRupiah(comp.discount)}</span></div>}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px', fontWeight:'bold'}}><span>TOTAL</span><span>{formatRupiah(comp.total)}</span></div>
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Metode Bayar</span><span style={{fontWeight:'bold'}}>{comp.payment_method}</span></div>
          {comp.payment_method === 'CASH' && (
            <div style={{width:'100%'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Uang Diterima</span><span>{formatRupiah(comp.total + comp.change_amount)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Kembalian</span><span style={{fontWeight:'bold'}}>{formatRupiah(comp.change_amount)}</span></div>
            </div>
          )}
          <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{textAlign:'center', marginTop:'12px', fontSize:'11px'}}>
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
        {/* Session Tabs */}
        <div className="flex items-center gap-1 px-2 pt-2 border-b overflow-x-auto">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-t-lg text-xs font-semibold cursor-pointer transition-colors flex-shrink-0 border-b-2 ${
                s.id === activeSession.id
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'text-gray-500 hover:bg-gray-50 border-transparent'
              }`}
            >
              {s.completed ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <ShoppingCart className="h-3 w-3" />}
              <span>{s.label}</span>
              {s.cart.length > 0 && !s.completed && (
                <span className="bg-primary text-white text-[10px] font-bold px-1 rounded-full">{s.cart.reduce((sum, i) => sum + i.qty, 0)}</span>
              )}
              <button
                onClick={e => { e.stopPropagation(); removeSession(s.id) }}
                className="ml-0.5 text-gray-300 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {sessions.length < 5 && (
            <button
              onClick={addSession}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg flex-shrink-0"
              title="Tambah antrian baru"
            >
              <Plus className="h-3.5 w-3.5" /> Baru
            </button>
          )}
        </div>

        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
            <ShoppingCart className="h-4 w-4" /> {activeSession.label}
          </div>
          {cart.length > 0 && !completed && <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cart.reduce((s, i) => s + i.qty, 0)}</span>}
        </div>

        {completed ? renderCompleted(completed) : (
          <>
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
                <input type="date" value={txDate} onChange={e => updateSession({ txDate: e.target.value })} className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]" />
              </div>

              {/* Motor input */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Jenis Motor</span>
                <input type="text" placeholder="Vario 125, Beat, dll..." value={motorType} onChange={e => updateSession({ motorType: e.target.value })} className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]" />
              </div>

              {/* Mechanic selector */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Mekanik</span>
                <select value={selectedMechanicId} onChange={e => updateSession({ selectedMechanicId: e.target.value })} className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[160px]">
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
                  onChange={e => updateSession({ discount: parseFloat(parseCurrencyInput(e.target.value)) || 0 })}
                  className="w-28 text-right border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>TOTAL</span><span className="text-primary">{formatRupiah(total)}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(['CASH', 'QRIS', 'TRANSFER'] as const).map(m => (
                  <button key={m} onClick={() => { updateSession({ paymentMethod: m, paidAmount: m !== 'CASH' ? total : paidAmount }) }}
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
                      onChange={e => updateSession({ paidAmount: parseFloat(parseCurrencyInput(e.target.value)) || 0 })}
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
          </>
        )}
      </div>

      {/* Manual Input Modal */}
      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Input Item Manual (Bisa Banyak)</h2>
              <button onClick={() => setManualOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {manualError && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{manualError}</div>}
              
              <div className="space-y-4">
                {manualForm.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-xl bg-gray-50/50 relative">
                    {manualForm.length > 1 && (
                      <button onClick={() => removeManualRow(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 border border-white">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className={item.type === 'Barang' ? "md:col-span-5" : "md:col-span-7"}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Item {index + 1}</label>
                        <input value={item.name} onChange={e => updateManualRow(item.id, 'name', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Nama barang / jasa" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Jenis</label>
                        <select value={item.type} onChange={e => updateManualRow(item.id, 'type', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                          <option value="Jasa">Jasa</option>
                          <option value="Barang">Barang</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                        <input type="text" value={formatCurrencyInput(item.price)} onChange={e => updateManualRow(item.id, 'price', parseCurrencyInput(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      {item.type === 'Barang' && (
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                          <input type="number" min="1" value={item.qty} onChange={e => updateManualRow(item.id, 'qty', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={addManualRow} className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-4 w-4" /> Tambah Baris Input
              </button>
              
            </div>

            <div className="flex gap-3 justify-between items-center p-5 border-t bg-gray-50 rounded-b-xl">
              <div className="text-sm">
                <span className="text-gray-500">Total Subtotal: </span>
                <span className="font-bold text-gray-900">
                  {formatRupiah(manualForm.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.type === 'Jasa' ? 1 : parseInt(item.qty) || 0)), 0))}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setManualOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-100 bg-white">Batal</button>
                <button onClick={addManual} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Tambahkan Semua</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
