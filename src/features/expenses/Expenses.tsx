import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort, generateExpenseNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Search, Calendar, Trash, Eye, X } from 'lucide-react'

type ExpenseItem = {
  id: string
  name: string
  price: number
  qty: number
}

type Expense = {
  id: string
  expense_number: string
  category: string
  mechanic_id: string | null
  amount: number
  payment_method: string
  description: string | null
  date: string
  created_by: string | null
  items: ExpenseItem[] | null
  mechanics?: { name: string } | null
  profiles?: { full_name: string | null } | null
}

export function Expenses() {
  const { user, isOwner, isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  
  // State for form
  const [form, setForm] = useState({ category: '', mechanic_id: '', payment_method: 'CASH', description: '', date: new Date().toISOString().split('T')[0] })
  const [cart, setCart] = useState<ExpenseItem[]>([])
  
  // State for item input form
  const [itemForm, setItemForm] = useState({ name: '', price: '', qty: '1' })
  
  const [error, setError] = useState('')
  
  // View Details Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', dateFilter, startDate, endDate],
    queryFn: async () => {
      let q = supabase.from('expenses').select('*, profiles(full_name), mechanics(name)').order('created_at', { ascending: false })
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        q = q.gte('date', today)
      } else if (dateFilter === 'month') {
        const monthStart = new Date().toISOString().slice(0, 7) + '-01'
        q = q.gte('date', monthStart)
      } else if (dateFilter === 'year') {
        const yearStart = new Date().getFullYear() + '-01-01'
        q = q.gte('date', yearStart)
      } else if (dateFilter === 'custom' && startDate && endDate) {
        q = q.gte('date', startDate).lte('date', endDate)
      }
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Expense[]
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('expense_categories').select('name').order('name')
      return (data ?? []).map((c: any) => c.name)
    }
  })

  const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics-active'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name').eq('status', 'ACTIVE')
      return data ?? []
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] })
  })

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        expense_number: generateExpenseNumber(),
        category: form.category,
        mechanic_id: form.category === 'Gaji Mekanik' ? (form.mechanic_id || null) : null,
        amount: totalAmount,
        payment_method: form.payment_method,
        description: form.description.trim() || null,
        date: form.date,
        items: cart,
        created_by: user?.id ?? null
      }
      const { error } = await supabase.from('expenses').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setModalOpen(false)
      setForm({ category: '', mechanic_id: '', payment_method: 'CASH', description: '', date: new Date().toISOString().split('T')[0] })
      setCart([])
      setItemForm({ name: '', price: '', qty: '1' })
    },
    onError: () => setError('Gagal menyimpan data pengeluaran.')
  })

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!itemForm.name.trim()) return setError('Nama rincian wajib diisi.')
    const price = parseFloat(itemForm.price)
    const qty = parseInt(itemForm.qty)
    if (!price || price <= 0) return setError('Harga harus lebih dari 0.')
    if (!qty || qty < 1) return setError('Qty harus minimal 1.')
    
    setCart(prev => [...prev, { id: crypto.randomUUID(), name: itemForm.name.trim(), price, qty }])
    setItemForm({ name: '', price: '', qty: '1' })
  }

  function handleRemoveItem(id: string) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (cart.length === 0) return setError('Minimal harus ada 1 rincian pengeluaran.')
    if (!form.category) return setError('Kategori wajib dipilih.')
    if (form.category === 'Gaji Mekanik' && !form.mechanic_id) return setError('Pilih mekanik terlebih dahulu.')
    if (form.category === 'Gaji Mekanik' && !form.description.trim()) return setError('Keterangan gaji wajib diisi (misal: Gaji Bulan Agustus).')
    saveMutation.mutate()
  }

  const filtered = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) || 
    e.expense_number.toLowerCase().includes(search.toLowerCase()) ||
    (e.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.mechanics?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const todayTotal = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0)
  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0)

  const catTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 1)[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-500 mt-1">Catat semua beban operasional bengkel</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
          <Plus className="h-4 w-4" /> Catat Pengeluaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Hari Ini</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(todayTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Bulan Ini</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(monthTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Pengeluaran Terbesar</p>
          <p className="text-lg font-bold text-gray-900 mt-1 truncate">{topCat ? topCat[0] : '-'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{topCat ? formatRupiah(topCat[1]) : ''}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-white border rounded-lg px-3 py-2 shadow-sm overflow-hidden">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Cari nomor, kategori, mekanik..." className="flex-1 text-sm outline-none bg-transparent min-w-0 w-full" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-sm outline-none bg-transparent">
            <option value="">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="custom">Kustom</option>
          </select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm outline-none bg-transparent" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm outline-none bg-transparent" />
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Tidak ada data pengeluaran.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nomor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Keterangan</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Nominal</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.expense_number}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateShort(e.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.category}
                      {e.mechanics && <span className="block text-[11px] text-gray-500 mt-0.5">Mekanik: {e.mechanics.name}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate" title={e.description || ''}>{e.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">-{formatRupiah(e.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {e.items && e.items.length > 0 && (
                          <button onClick={() => { setSelectedExpense(e); setDetailModalOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Lihat Rincian">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {(isOwner || isAdmin) && (
                          <button onClick={() => { if(confirm('Yakin hapus pengeluaran ini?')) deleteMutation.mutate(e.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus">
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CATAT PENGELUARAN MULTI-ITEM */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Catat Pengeluaran</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bagian Info Umum */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Informasi Umum</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
                      <option value="">— Pilih Kategori —</option>
                      {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  {form.category === 'Gaji Mekanik' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Pilih Mekanik <span className="text-red-500">*</span></label>
                      <select value={form.mechanic_id} onChange={e => setForm(f => ({ ...f, mechanic_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
                        <option value="">— Pilih Mekanik —</option>
                        {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Metode</label>
                      <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
                        <option value="CASH">CASH</option>
                        <option value="QRIS">QRIS</option>
                        <option value="TRANSFER">TRANSFER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan Umum {form.category === 'Gaji Mekanik' && <span className="text-red-500">*</span>}</label>
                    <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" placeholder="Keterangan tambahan..." />
                  </div>
                </div>

                {/* Bagian Input Item (Keranjang) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 border-b pb-2">Rincian Pengeluaran</h3>
                  <div className="bg-gray-50 border rounded-lg p-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nama Barang / Keperluan</label>
                      <input type="text" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="Misal: Kopi, Sabun, Gaji..." className="w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/40" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Harga (Rp)</label>
                        <input type="text" value={formatCurrencyInput(itemForm.price)} onChange={e => setItemForm(f => ({ ...f, price: parseCurrencyInput(e.target.value) }))} placeholder="0" className="w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/40" />
                      </div>
                      <div className="w-16">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                        <input type="number" min="1" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))} className="w-full border rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 text-center" />
                      </div>
                    </div>
                    <button onClick={handleAddItem} type="button" className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-2 rounded-md transition-colors">
                      + TAMBAH KE RINCIAN
                    </button>
                  </div>

                  {/* List Keranjang */}
                  <div className="border rounded-lg overflow-hidden flex flex-col max-h-48">
                    <div className="bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 border-b">
                      Daftar Rincian ({cart.length})
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2 flex-1">
                      {cart.length === 0 ? (
                        <p className="text-xs text-center text-gray-400 py-4">Belum ada rincian ditambahkan.</p>
                      ) : cart.map((item, idx) => (
                        <div key={item.id} className="flex justify-between items-start gap-2 bg-white border p-2 rounded text-sm shadow-sm">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate leading-tight">{idx + 1}. {item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.qty} × {formatRupiah(item.price)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900">{formatRupiah(item.price * item.qty)}</p>
                            <button onClick={() => handleRemoveItem(item.id)} type="button" className="text-red-500 text-xs hover:underline mt-0.5 inline-block">Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cart.length > 0 && (
                      <div className="bg-red-50 border-t px-3 py-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-red-800">TOTAL</span>
                        <span className="text-sm font-bold text-red-600">{formatRupiah(totalAmount)}</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end px-5 py-4 border-t bg-gray-50 flex-shrink-0">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border bg-white rounded-lg hover:bg-gray-100">Batal</button>
              <button type="button" onClick={handleSubmit} disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2">
                {saveMutation.isPending ? 'Menyimpan...' : 'SIMPAN PENGELUARAN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT DETAIL (RINCIAN) */}
      {detailModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Detail Pengeluaran</h2>
              <button onClick={() => setDetailModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center pb-3 border-b border-dashed">
                <p className="text-xs text-gray-500 font-mono">{selectedExpense.expense_number}</p>
                <p className="font-bold text-gray-900 mt-1">{selectedExpense.category}</p>
                <p className="text-xs text-gray-500">{formatDateShort(selectedExpense.date)} • {selectedExpense.payment_method}</p>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-600">RINCIAN ITEM</p>
                {selectedExpense.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 pr-2">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-xs text-gray-500">{item.qty} × {formatRupiah(item.price)}</div>
                    </div>
                    <div className="font-semibold whitespace-nowrap">{formatRupiah(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-dashed pt-3 flex justify-between items-center">
                <span className="font-bold text-gray-900">TOTAL</span>
                <span className="font-bold text-red-600 text-lg">{formatRupiah(selectedExpense.amount)}</span>
              </div>
              
              {selectedExpense.description && (
                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 mt-2">
                  <span className="font-bold block mb-1">Keterangan:</span>
                  {selectedExpense.description}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t bg-gray-50">
              <button onClick={() => setDetailModalOpen(false)} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 rounded-lg text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
