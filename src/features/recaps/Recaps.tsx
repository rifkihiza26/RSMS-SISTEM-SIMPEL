import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, generateTransactionNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Trash2, Wrench, Package, Save } from 'lucide-react'

type RecapJasa = { id: string; name: string; price: string }
type RecapBarang = { id: string; name: string; priceModal: string; priceJual: string; qty: string }

export function Recaps() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [mechanicId, setMechanicId] = useState('')
  const [motorType, setMotorType] = useState('')
  const [notaType, setNotaType] = useState<'KECIL' | 'BESAR'>('KECIL')

  const [jasaList, setJasaList] = useState<RecapJasa[]>([])
  const [barangList, setBarangList] = useState<RecapBarang[]>([])

  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics-active'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id,name').order('name')
      return data ?? []
    }
  })

  const totalJasa = jasaList.reduce((s, j) => s + (parseFloat(j.price) || 0), 0)
  const totalBarangJual = barangList.reduce((s, b) => s + (parseFloat(b.priceJual) || 0) * (parseInt(b.qty) || 1), 0)
  const totalBarangModal = barangList.reduce((s, b) => s + (parseFloat(b.priceModal) || 0) * (parseInt(b.qty) || 1), 0)
  const totalAkhir = totalJasa + totalBarangJual
  const profitBarang = totalBarangJual - totalBarangModal
  const totalUntung = totalJasa + profitBarang

  const addJasa = () => setJasaList([...jasaList, { id: crypto.randomUUID(), name: '', price: '' }])
  const removeJasa = (id: string) => setJasaList(jasaList.filter(j => j.id !== id))
  const updateJasa = (id: string, field: string, val: string) => setJasaList(jasaList.map(j => j.id === id ? { ...j, [field]: val } : j))

  const addBarang = () => setBarangList([...barangList, { id: crypto.randomUUID(), name: '', priceModal: '', priceJual: '', qty: '1' }])
  const removeBarang = (id: string) => setBarangList(barangList.filter(b => b.id !== id))
  const updateBarang = (id: string, field: string, val: string) => setBarangList(barangList.map(b => b.id === id ? { ...b, [field]: val } : b))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(''); setSuccessMsg('')

    if (!mechanicId) return setErrorMsg('Pilih mekanik terlebih dahulu.')
    if (!motorType.trim()) return setErrorMsg('Isi jenis motor.')
    if (jasaList.length === 0 && barangList.length === 0) return setErrorMsg('Minimal isi 1 jasa atau 1 barang.')

    for (const j of jasaList) {
      if (!j.name.trim() || !(parseFloat(j.price) > 0)) return setErrorMsg('Pastikan nama dan harga Jasa terisi benar.')
    }
    for (const b of barangList) {
      if (!b.name.trim() || !(parseFloat(b.priceModal) >= 0) || !(parseFloat(b.priceJual) > 0) || !(parseInt(b.qty) > 0)) {
        return setErrorMsg('Pastikan nama, harga modal, harga jual, dan qty Barang terisi benar.')
      }
    }

    setProcessing(true)
    const mechanicName = mechanics.find(m => m.id === mechanicId)?.name || ''
    const notes = `[${notaType}] Mekanik: ${mechanicName} | Motor: ${motorType} | SUMBER: REKAPAN`
    const trxNumber = generateTransactionNumber()
    const targetTime = date + 'T12:00:00Z'

    try {
      // 1. Insert Transaction
      const { data: tx, error: errTx } = await supabase.from('transactions').insert({
        transaction_number: trxNumber,
        subtotal: totalAkhir,
        total: totalAkhir,
        discount: 0,
        payment_method: 'CASH',
        paid_amount: totalAkhir,
        change_amount: 0,
        status: 'PAID',
        notes: notes,
        mechanic_id: mechanicId,
        motor_type: motorType,
        created_by: user?.id,
        created_at: targetTime,
        updated_at: targetTime
      }).select('id').single()

      if (errTx) throw errTx

      // 2. Insert Items
      const itemsPayload = [
        ...jasaList.map(j => ({
          transaction_id: tx.id,
          item_type: 'MANUAL_JASA',
          item_name: j.name,
          quantity: 1,
          unit_price: parseFloat(j.price),
          subtotal: parseFloat(j.price),
          modal_price: 0, // Jasa tidak ada modal_price
          stock_tracked: false,
          created_at: targetTime
        })),
        ...barangList.map(b => ({
          transaction_id: tx.id,
          item_type: 'MANUAL_BARANG',
          item_name: b.name,
          quantity: parseInt(b.qty),
          unit_price: parseFloat(b.priceJual),
          subtotal: parseFloat(b.priceJual) * parseInt(b.qty),
          modal_price: parseFloat(b.priceModal),
          stock_tracked: false,
          created_at: targetTime
        }))
      ]

      const { error: errItems } = await supabase.from('transaction_items').insert(itemsPayload)
      if (errItems) throw errItems

      // 3. Insert Income entry
      const { error: errInc } = await supabase.from('incomes').insert({
        transaction_id: tx.id,
        amount: totalAkhir,
        payment_method: 'CASH',
        category: 'TRANSAKSI KASIR',
        date: date,
        description: `Penjualan ${trxNumber}`,
        created_by: user?.id,
        created_at: targetTime
      })
      if (errInc) throw errInc

      setSuccessMsg('Rekapan berhasil disimpan!')
      setMotorType('')
      setJasaList([])
      setBarangList([])
      qc.invalidateQueries({ queryKey: ['report-tx-items'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })

    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem')
    }
    setProcessing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekapan Servis</h1>
          <p className="text-sm text-gray-500 mt-1">Input manual data servis, bongkaran, & penjualan parts.</p>
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">{errorMsg}</div>}
      {successMsg && <div className="bg-green-50 text-green-600 p-3 rounded-lg border border-green-200 text-sm">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info Dasar */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-2 mb-4">Informasi Dasar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mekanik</label>
              <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" required>
                <option value="">-- Pilih Mekanik --</option>
                {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Motor / Plat</label>
              <input type="text" value={motorType} onChange={e => setMotorType(e.target.value)} placeholder="Vario B1234XX" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Nota</label>
              <select value={notaType} onChange={e => setNotaType(e.target.value as any)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="KECIL">Nota Kecil</option>
                <option value="BESAR">Nota Besar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jasa Section */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600"/> Jasa Pekerjaan</h2>
            <button type="button" onClick={addJasa} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="h-3.5 w-3.5"/> Tambah Jasa</button>
          </div>
          <div className="space-y-2">
            {jasaList.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada jasa.</p> : jasaList.map((j, i) => (
              <div key={j.id} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4">{i+1}.</span>
                <input type="text" placeholder="Nama Jasa" value={j.name} onChange={e => updateJasa(j.id, 'name', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                <input type="text" placeholder="Harga Jasa" value={formatCurrencyInput(j.price)} onChange={e => updateJasa(j.id, 'price', parseCurrencyInput(e.target.value))} className="w-40 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                <button type="button" onClick={() => removeJasa(j.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4"/></button>
              </div>
            ))}
          </div>
          {jasaList.length > 0 && <div className="mt-3 text-right text-sm text-gray-600">Total Jasa: <span className="font-bold text-gray-900">{formatRupiah(totalJasa)}</span></div>}
        </div>

        {/* Barang Section */}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Package className="h-4 w-4 text-orange-600"/> Sparepart / Barang</h2>
            <button type="button" onClick={addBarang} className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"><Plus className="h-3.5 w-3.5"/> Tambah Part</button>
          </div>
          <div className="space-y-2">
            {barangList.length === 0 ? <p className="text-xs text-gray-400 italic">Belum ada part.</p> : barangList.map((b, i) => (
              <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50/50 p-2 border rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-bold text-gray-400 w-4">{i+1}.</span>
                  <input type="text" placeholder="Nama Part" value={b.name} onChange={e => updateBarang(b.id, 'name', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
                <div className="flex items-center gap-2 pl-6 sm:pl-0">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Harga Beli/Modal</label>
                    <input type="text" placeholder="Modal" value={formatCurrencyInput(b.priceModal)} onChange={e => updateBarang(b.id, 'priceModal', parseCurrencyInput(e.target.value))} className="w-28 sm:w-32 border border-red-200 bg-red-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-red-900" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Harga Jual</label>
                    <input type="text" placeholder="Jual" value={formatCurrencyInput(b.priceJual)} onChange={e => updateBarang(b.id, 'priceJual', parseCurrencyInput(e.target.value))} className="w-28 sm:w-32 border border-green-200 bg-green-50/30 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none text-green-900" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Qty</label>
                    <input type="number" min="1" placeholder="Qty" value={b.qty} onChange={e => updateBarang(b.id, 'qty', e.target.value)} className="w-16 border rounded-lg px-2 py-2 text-center text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
                  </div>
                  <div className="mt-4">
                    <button type="button" onClick={() => removeBarang(b.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {barangList.length > 0 && (
            <div className="mt-3 text-right text-sm text-gray-600 space-y-1">
              <div>Total Harga Modal: <span className="text-red-600">{formatRupiah(totalBarangModal)}</span></div>
              <div>Total Harga Jual: <span className="font-bold text-gray-900">{formatRupiah(totalBarangJual)}</span></div>
              <div className="text-green-600 font-semibold border-t pt-1 mt-1 inline-block">Estimasi Untung Part: {formatRupiah(profitBarang)}</div>
            </div>
          )}
        </div>

        {/* Grand Total & Submit */}
        <div className="bg-gray-900 text-white p-5 rounded-xl flex sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Tagihan (Jasa + Jual Part)</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">{formatRupiah(totalAkhir)}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Modal:</span> <span className="text-red-400 font-semibold">{formatRupiah(totalBarangModal)}</span></div>
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Untung:</span> <span className="text-green-400 font-semibold">{formatRupiah(totalUntung)}</span></div>
            </div>
          </div>
          <button type="submit" disabled={processing} className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
            {processing ? 'Menyimpan...' : <><Save className="h-5 w-5"/> Simpan Rekapan</>}
          </button>
        </div>

      </form>
    </div>
  )
}
