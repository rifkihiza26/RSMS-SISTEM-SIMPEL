const fs = require('fs');

const code = `import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, generateTransactionNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Trash2, Wrench, Package, Save, CheckCircle, Printer, FileText, Search } from 'lucide-react'

type RecapJasa = { id: string; name: string; price: string }
type RecapBarang = { id: string; name: string; priceModal: string; priceJual: string; qty: string }

// ----------------------------------------------------
// PRINT FUNCTION (NEAT PDF)
// ----------------------------------------------------
function printRecapReceipt(trx: any, jasaList: any[], barangList: any[], totalJasa: number, totalPart: number, totalAkhir: number) {
  const win = window.open('', '_blank')
  if (!win) return

  const isLunas = trx.payment_status === 'LUNAS'
  const sisa = totalAkhir - trx.amount_paid
  
  win.document.write(\`
    <html><head><title>Nota Servis - \${trx.transaction_number}</title>
    <style>
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #222; padding-bottom: 15px; }
      .header h1 { margin: 0; font-size: 24px; color: #111; }
      .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
      .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
      .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee; width: 48%; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
      .info-label { color: #666; }
      .info-val { font-weight: 600; }
      .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
      .st-lunas { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      .st-dp { background: #fef08a; color: #854d0e; border: 1px solid #fde047; }
      .st-belum { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
      table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
      th { background: #1f2937; color: white; text-align: left; padding: 10px; }
      td { padding: 10px; border-bottom: 1px solid #eee; }
      .right { text-align: right; }
      .totals-box { margin-left: auto; width: 350px; border-top: 2px solid #222; padding-top: 15px; }
      .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .total-row.grand { font-size: 18px; font-weight: bold; color: #111; border-top: 1px solid #eee; padding-top: 10px; margin-top: 5px; }
      .total-row.paid { color: #166534; font-weight: bold; }
      .total-row.debt { color: #dc2626; font-weight: bold; }
      .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #888; }
    </style>
    </head><body>
      <div class="header">
        <h1>RAKYAT SINTING MATIC SHOP</h1>
        <p>Nota Layanan Servis & Penjualan Parts</p>
      </div>
      
      <div class="info-grid">
        <div class="info-box">
          <div class="info-row"><span class="info-label">No. Nota:</span> <span class="info-val">\${trx.transaction_number}</span></div>
          <div class="info-row"><span class="info-label">Tanggal:</span> <span class="info-val">\${new Date(trx.created_at).toLocaleString('id-ID')}</span></div>
          <div class="info-row"><span class="info-label">Mekanik:</span> <span class="info-val">\${trx.mechanicName || '-'}</span></div>
        </div>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Pelanggan:</span> <span class="info-val">\${trx.customer_name || '-'}</span></div>
          <div class="info-row"><span class="info-label">Motor:</span> <span class="info-val">\${trx.motor}</span></div>
          <div class="info-row"><span class="info-label">Status Bayar:</span> 
            <span class="status-badge \${isLunas ? 'st-lunas' : trx.amount_paid > 0 ? 'st-dp' : 'st-belum'}">\${trx.payment_status}</span>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Deskripsi Layanan / Parts</th>
            <th class="right">Qty</th>
            <th class="right">Harga</th>
            <th class="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          \${jasaList.map(j => \`
            <tr>
              <td>[Jasa] \${j.name}</td>
              <td class="right">-</td>
              <td class="right">\${formatRupiah(parseInt(j.price))}</td>
              <td class="right">\${formatRupiah(parseInt(j.price))}</td>
            </tr>
          \`).join('')}
          \${barangList.map(b => \`
            <tr>
              <td>[Part] \${b.name}</td>
              <td class="right">\${b.qty}</td>
              <td class="right">\${formatRupiah(parseInt(b.priceJual))}</td>
              <td class="right">\${formatRupiah(parseInt(b.priceJual) * parseInt(b.qty))}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="total-row"><span>Total Jasa:</span> <span>\${formatRupiah(totalJasa)}</span></div>
        <div class="total-row"><span>Total Parts:</span> <span>\${formatRupiah(totalPart)}</span></div>
        <div class="total-row grand"><span>TOTAL TAGIHAN:</span> <span>\${formatRupiah(totalAkhir)}</span></div>
        <div class="total-row paid" style="margin-top: 15px;"><span>Telah Dibayar:</span> <span>\${formatRupiah(trx.amount_paid)}</span></div>
        \${!isLunas ? \`<div class="total-row debt"><span>SISA KEKURANGAN:</span> <span>\${formatRupiah(sisa)}</span></div>\` : ''}
      </div>

      <div class="footer">
        <p>Terima kasih telah mempercayakan kendaraan Anda pada RSMS!</p>
        <p>Dicetak pada: \${new Date().toLocaleString('id-ID')}</p>
      </div>
      <script>window.print();</script>
    </body></html>
  \`)
  win.document.close()
}

// ----------------------------------------------------
// ADMIN RECAPS MANAGER (Form + List)
// ----------------------------------------------------
function AdminRecapsManager() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'BUAT' | 'DAFTAR'>('BUAT')

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [mechanicId, setMechanicId] = useState('')
  const [motorType, setMotorType] = useState('')
  const [notaType, setNotaType] = useState<'KECIL' | 'BESAR'>('KECIL')
  
  // New Fields for Payment
  const [customerName, setCustomerName] = useState('')
  const [amountPaidInput, setAmountPaidInput] = useState('')

  const [jasaList, setJasaList] = useState<RecapJasa[]>([])
  const [barangList, setBarangList] = useState<RecapBarang[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // Success popup state
  const [successTrx, setSuccessTrx] = useState<any>(null)
  
  // Payment modal state
  const [payModalData, setPayModalData] = useState<any>(null)
  const [payModalInput, setPayModalInput] = useState('')

  const { data: mechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  // List of recaps for Admin to manage debts
  const { data: recapsList = [], isLoading: loadingList } = useQuery({
    queryKey: ['recaps', 'admin-list'],
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('*, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false }).limit(50)
      return data ?? []
    }
  })

  // Computed Totals
  const totalJasa = jasaList.reduce((acc, curr) => acc + (parseInt(curr.price) || 0), 0)
  const totalBarangModal = barangList.reduce((acc, curr) => acc + ((parseInt(curr.priceModal) || 0) * (parseInt(curr.qty) || 1)), 0)
  const totalBarangJual = barangList.reduce((acc, curr) => acc + ((parseInt(curr.priceJual) || 0) * (parseInt(curr.qty) || 1)), 0)
  const profitBarang = totalBarangJual - totalBarangModal
  const totalUntung = totalJasa + profitBarang
  const totalAkhir = totalJasa + totalBarangJual

  const amountPaidNum = parseInt(parseCurrencyInput(amountPaidInput)) || 0
  const sisaTagihan = totalAkhir - amountPaidNum
  const paymentStatus = amountPaidNum >= totalAkhir ? 'LUNAS' : amountPaidNum > 0 ? 'DP' : 'BELUM_BAYAR'

  const handleSave = async () => {
    if (!mechanicId) return alert('Pilih mekanik terlebih dahulu!')
    if (jasaList.length === 0 && barangList.length === 0) return alert('Masukkan minimal 1 jasa atau barang!')
    if (!customerName.trim()) return alert('Nama pelanggan wajib diisi!')

    setIsSaving(true)
    try {
      const mechanicName = mechanics.find(m => m.id === mechanicId)?.name || 'Unknown'
      const notes = \`[\${notaType}] Mekanik: \${mechanicName} | Motor: \${motorType} | SUMBER: REKAPAN\`
      const trxNumber = generateTransactionNumber(notaType)

      const { data: trxData, error: trxError } = await supabase.from('transactions').insert({
        transaction_number: trxNumber,
        total: totalAkhir,
        payment_method: 'CASH',
        notes: notes,
        mechanic_id: mechanicId,
        customer_name: customerName,
        payment_status: paymentStatus,
        amount_paid: amountPaidNum,
        created_at: date + 'T12:00:00Z'
      }).select().single()

      if (trxError) throw trxError

      const insertItems = []
      for (const j of jasaList) {
        insertItems.push({
          transaction_id: trxData.id,
          product_name: j.name,
          quantity: 1,
          price: parseInt(j.price),
          subtotal: parseInt(j.price),
          item_type: 'MANUAL_JASA',
          modal_price: 0
        })
      }

      for (const b of barangList) {
        insertItems.push({
          transaction_id: trxData.id,
          product_name: b.name,
          quantity: parseInt(b.qty),
          price: parseInt(b.priceJual),
          subtotal: parseInt(b.priceJual) * parseInt(b.qty),
          item_type: 'MANUAL_BARANG',
          modal_price: parseInt(b.priceModal)
        })
      }

      if (insertItems.length > 0) {
        const { error: itemsError } = await supabase.from('transaction_items').insert(insertItems)
        if (itemsError) throw itemsError
      }

      // Success
      setSuccessTrx({
        ...trxData, 
        mechanicName,
        motor: motorType,
        jasaList: [...jasaList],
        barangList: [...barangList],
        totalJasa, totalPart: totalBarangJual
      })
      
      qc.invalidateQueries({ queryKey: ['recaps'] })

      // Reset
      setDate(new Date().toISOString().split('T')[0])
      setMechanicId('')
      setMotorType('')
      setCustomerName('')
      setAmountPaidInput('')
      setJasaList([])
      setBarangList([])
    } catch (error: any) {
      alert('Gagal menyimpan rekapan: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePayDebt = async () => {
    if (!payModalData) return
    const addAmt = parseInt(parseCurrencyInput(payModalInput)) || 0
    if (addAmt <= 0) return alert('Nominal harus lebih dari 0')
    
    const newPaid = payModalData.amount_paid + addAmt
    const newStatus = newPaid >= payModalData.total ? 'LUNAS' : 'DP'

    try {
      const { error } = await supabase.from('transactions').update({
        amount_paid: newPaid,
        payment_status: newStatus
      }).eq('id', payModalData.id)
      
      if (error) throw error
      alert('Pelunasan berhasil disimpan!')
      setPayModalData(null)
      setPayModalInput('')
      qc.invalidateQueries({ queryKey: ['recaps'] })
    } catch (e: any) {
      alert('Gagal: ' + e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Rekapan</h1>
          <p className="text-sm text-gray-500 mt-1">Input manual dan kelola piutang servis.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('BUAT')} 
            className={\`px-6 py-2 rounded-lg text-sm font-semibold transition-all \${activeTab === 'BUAT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>
            Buat Rekapan
          </button>
          <button 
            onClick={() => setActiveTab('DAFTAR')} 
            className={\`px-6 py-2 rounded-lg text-sm font-semibold transition-all \${activeTab === 'DAFTAR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}>
            Daftar & Piutang
          </button>
        </div>
      </div>

      {activeTab === 'DAFTAR' && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {loadingList ? <div className="p-10 text-center">Memuat data...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pelanggan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sisa Hutang</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recapsList.map((tx: any) => {
                  const sisa = tx.total - (tx.amount_paid || 0)
                  return (
                    <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{tx.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(tx.total)}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">{sisa > 0 ? formatRupiah(sisa) : 'Rp0'}</td>
                      <td className="px-4 py-3 text-center">
                        {tx.payment_status === 'LUNAS' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">LUNAS</span>
                        ) : tx.payment_status === 'DP' ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">DP</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">BELUM BAYAR</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tx.payment_status !== 'LUNAS' ? (
                          <button onClick={() => setPayModalData(tx)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
                            LUNASI
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'BUAT' && (
        <div className="space-y-6 max-w-4xl">
          {/* Formulir Dasar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h2 className="font-semibold text-gray-900 border-b pb-2">Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mekanik</label>
                <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Pilih Mekanik --</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Motor / Plat</label>
                <input type="text" value={motorType} onChange={e => setMotorType(e.target.value)} placeholder="Vario B1234XX" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Nota</label>
                <select value={notaType} onChange={e => setNotaType(e.target.value as any)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="KECIL">Nota Kecil</option>
                  <option value="BESAR">Nota Besar</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama Pelanggan <span className="text-red-500">*</span></label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nama pelanggan untuk pencatatan..." className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-blue-50" />
            </div>
          </div>

          {/* Jasa Pekerjaan */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-600"/> Jasa Pekerjaan</h2>
              <button onClick={() => setJasaList([...jasaList, { id: Date.now().toString(), name: '', price: '' }])} className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Jasa
              </button>
            </div>
            {jasaList.length === 0 ? <p className="text-sm text-gray-400 italic">Belum ada jasa.</p> : (
              <div className="space-y-3">
                {jasaList.map((jasa, idx) => (
                  <div key={jasa.id} className="flex gap-3 items-start">
                    <input type="text" placeholder="Nama Jasa (Bongkar CVT, dll)" value={jasa.name} onChange={e => { const newL = [...jasaList]; newL[idx].name = e.target.value; setJasaList(newL); }} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <input type="text" placeholder="Tarif Rp" value={formatCurrencyInput(jasa.price)} onChange={e => { const newL = [...jasaList]; newL[idx].price = parseCurrencyInput(e.target.value); setJasaList(newL); }} className="w-40 border rounded-lg px-3 py-2 text-sm" />
                    <button onClick={() => setJasaList(jasaList.filter(x => x.id !== jasa.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sparepart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-orange-600"/> Sparepart / Barang</h2>
              <button onClick={() => setBarangList([...barangList, { id: Date.now().toString(), name: '', priceModal: '', priceJual: '', qty: '1' }])} className="text-orange-600 text-sm font-medium hover:text-orange-700 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Tambah Part
              </button>
            </div>
            {barangList.length === 0 ? <p className="text-sm text-gray-400 italic">Belum ada part.</p> : (
              <div className="space-y-3">
                {barangList.map((brg, idx) => (
                  <div key={brg.id} className="flex gap-2 items-start flex-wrap md:flex-nowrap">
                    <input type="text" placeholder="Nama Barang" value={brg.name} onChange={e => { const newL = [...barangList]; newL[idx].name = e.target.value; setBarangList(newL); }} className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm" />
                    <input type="text" placeholder="Modal Rp" value={formatCurrencyInput(brg.priceModal)} onChange={e => { const newL = [...barangList]; newL[idx].priceModal = parseCurrencyInput(e.target.value); setBarangList(newL); }} className="w-32 border rounded-lg px-3 py-2 text-sm bg-gray-50" title="Harga Modal" />
                    <input type="text" placeholder="Jual Rp" value={formatCurrencyInput(brg.priceJual)} onChange={e => { const newL = [...barangList]; newL[idx].priceJual = parseCurrencyInput(e.target.value); setBarangList(newL); }} className="w-32 border rounded-lg px-3 py-2 text-sm" title="Harga Jual" />
                    <input type="number" placeholder="Qty" value={brg.qty} onChange={e => { const newL = [...barangList]; newL[idx].qty = e.target.value; setBarangList(newL); }} className="w-20 border rounded-lg px-3 py-2 text-sm" min="1" />
                    <button onClick={() => setBarangList(barangList.filter(x => x.id !== brg.id))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total & Payment */}
          <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg border border-gray-800">
            
            <div className="flex flex-col md:flex-row gap-8 justify-between">
              
              {/* Kiri: Pembayaran Form */}
              <div className="flex-1 space-y-4">
                <h3 className="text-gray-300 font-semibold border-b border-gray-700 pb-2">Informasi Pembayaran</h3>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nominal Dibayar (Kas)</label>
                  <div className="flex items-center">
                    <span className="bg-gray-800 text-gray-400 px-3 py-2 rounded-l-lg border border-r-0 border-gray-700">Rp</span>
                    <input 
                      type="text" 
                      value={formatCurrencyInput(amountPaidInput)} 
                      onChange={e => setAmountPaidInput(parseCurrencyInput(e.target.value))} 
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-r-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-blue-500" 
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika ngutang full. Isi sesuai nominal jika DP.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-400">Sisa Tagihan / Hutang</div>
                    <div className={\`font-bold text-lg mt-1 \${sisaTagihan > 0 ? 'text-red-400' : 'text-green-400'}\`}>
                      {formatRupiah(sisaTagihan > 0 ? sisaTagihan : 0)}
                    </div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="text-xs text-gray-400">Status Pembayaran</div>
                    <div className={\`font-bold text-lg mt-1 \${paymentStatus === 'LUNAS' ? 'text-green-400' : paymentStatus === 'DP' ? 'text-yellow-400' : 'text-red-400'}\`}>
                      {paymentStatus === 'LUNAS' ? 'LUNAS' : paymentStatus === 'DP' ? 'DP' : 'BELUM BAYAR'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanan: Totals & Save */}
              <div className="flex-1 flex flex-col items-end justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="w-full text-right space-y-1">
                  <p className="text-gray-400 text-sm">Total Tagihan (Jasa + Jual Part)</p>
                  <p className="text-4xl font-bold text-blue-400 pb-2">{formatRupiah(totalAkhir)}</p>
                  
                  <div className="flex justify-end gap-4 text-xs">
                    <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Modal:</span> <span className="text-red-400 font-semibold">{formatRupiah(totalBarangModal)}</span></div>
                    <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Untung:</span> <span className="text-green-400 font-semibold">{formatRupiah(totalUntung)}</span></div>
                  </div>
                </div>
                
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Rekapan & Pembayaran'}
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}
      
      {/* SUCCESS MODAL FOR ADMIN */}
      {successTrx && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tersimpan!</h2>
            <p className="text-gray-600 text-sm mb-6">Data rekapan servis berhasil dicatat dalam sistem.</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => printRecapReceipt(successTrx, successTrx.jasaList, successTrx.barangList, successTrx.totalJasa, successTrx.totalPart, successTrx.total)} 
                className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Printer className="w-5 h-5" /> Cetak Nota (PDF)
              </button>
              <button 
                onClick={() => setSuccessTrx(null)} 
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Tutup & Buat Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAY DEBT MODAL */}
      {payModalData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pelunasan Tagihan</h2>
            
            <div className="bg-gray-50 border rounded-lg p-4 mb-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Pelanggan:</span> <span className="font-bold">{payModalData.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Tagihan:</span> <span className="font-bold">{formatRupiah(payModalData.total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Sudah Dibayar (DP):</span> <span className="font-bold text-green-600">{formatRupiah(payModalData.amount_paid)}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-base"><span className="text-gray-700">Sisa Hutang:</span> <span className="text-red-600">{formatRupiah(payModalData.total - payModalData.amount_paid)}</span></div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Masukkan Nominal Pembayaran Baru</label>
              <div className="flex items-center">
                <span className="bg-gray-100 text-gray-500 px-4 py-3 rounded-l-lg border border-r-0 font-medium">Rp</span>
                <input 
                  type="text" 
                  value={formatCurrencyInput(payModalInput)} 
                  onChange={e => setPayModalInput(parseCurrencyInput(e.target.value))} 
                  className="flex-1 border rounded-r-lg px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPayModalData(null)} className="flex-1 bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handlePayDebt} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">Simpan Pelunasan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------
// OWNER RECAPS LIST (View Only)
// ----------------------------------------------------
function OwnerRecapsList() {
  const { data: allMechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['recaps', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanic_id, customer_name, payment_status, amount_paid, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) console.error(error)
      return data ?? []
    }
  })

  const recapsWithCalc = recaps.map((tx: any) => {
    const items = tx.transaction_items || []
    const modal = items.reduce((s: number, i: any) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
    const untung = tx.total - modal
    const mechanic = allMechanics.find((m: any) => m.id === tx.mechanic_id)
    return { ...tx, modal, untung, mechanicName: mechanic?.name || '-' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Rekapan Servis</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar rekapan servis, hutang/DP pelanggan, & total keuntungan.</p>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data...</div>
        ) : recapsWithCalc.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Belum ada rekapan servis</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pelanggan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mekanik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Modal</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Untung</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Sisa Hutang</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {recapsWithCalc.map((trx: any) => {
                  const sisa = trx.total - (trx.amount_paid || 0)
                  return (
                    <tr key={trx.transaction_number} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(trx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{trx.customer_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{trx.mechanicName}</td>
                      <td className="px-4 py-3 text-right text-red-600 whitespace-nowrap">{formatRupiah(trx.modal)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">{formatRupiah(trx.untung)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupiah(trx.total)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600 whitespace-nowrap">{sisa > 0 ? formatRupiah(sisa) : 'Rp0'}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {trx.payment_status === 'LUNAS' ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">LUNAS</span>
                        ) : trx.payment_status === 'DP' ? (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200">DP</span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200">BELUM BAYAR</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------
// MAIN EXPORT
// ----------------------------------------------------
export function Recaps() {
  const { isOwner } = useAuth()
  if (isOwner) return <OwnerRecapsList />
  return <AdminRecapsManager />
}
`;
fs.writeFileSync('src/features/recaps/Recaps.tsx', code);
