import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort, generateExpenseNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Search, Calendar } from 'lucide-react'

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
  mechanics?: { name: string } | null
  profiles?: { full_name: string | null } | null
}


export function Expenses() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ category: '', mechanic_id: '', amount: '', payment_method: 'CASH', description: '', date: new Date().toISOString().split('T')[0] })
  
  const [error, setError] = useState('')

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        expense_number: generateExpenseNumber(),
        category: form.category,
        mechanic_id: form.category === 'Gaji Mekanik' ? (form.mechanic_id || null) : null,
        amount: parseFloat(form.amount) || 0,
        payment_method: form.payment_method,
        description: form.description.trim() || null,
        date: form.date,
        created_by: user?.id ?? null
      }
      const { error } = await supabase.from('expenses').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setModalOpen(false)
      setForm({ category: '', mechanic_id: '', amount: '', payment_method: 'CASH', description: '', date: new Date().toISOString().split('T')[0] })
    },
    onError: () => setError('Gagal menyimpan data pengeluaran.')
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (parseFloat(form.amount) <= 0) return setError('Nominal harus lebih dari 0.')
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

  // Top category logic (simple)
  const catTotals = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc }, {} as Record<string, number>)
  const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 1)[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengeluaran</h1>
          <p className="text-sm text-gray-500 mt-1">Catat semua beban operasional bengkel</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
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

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Cari nomor, kategori, mekanik..." className="flex-1 text-sm outline-none bg-transparent" value={search} onChange={e => setSearch(e.target.value)} />
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
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Metode</th>
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
                    <td className="px-4 py-3 text-right font-semibold text-red-600">{formatRupiah(e.amount)}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{e.payment_method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Catat Pengeluaran</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">— Pilih Kategori —</option>
                  {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              {form.category === 'Gaji Mekanik' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Mekanik <span className="text-red-500">*</span></label>
                  <select value={form.mechanic_id} onChange={e => setForm(f => ({ ...f, mechanic_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">— Pilih Mekanik —</option>
                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
                <input type="text" value={formatCurrencyInput(form.amount)} onChange={e => setForm(f => ({ ...f, amount: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metode</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="CASH">CASH</option>
                    <option value="QRIS">QRIS</option>
                    <option value="TRANSFER">TRANSFER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan {form.category === 'Gaji Mekanik' && <span className="text-red-500">*</span>}</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={form.category === 'Gaji Mekanik' ? 'Gaji bulan Agustus...' : 'Beli air minum galon...'} />
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
