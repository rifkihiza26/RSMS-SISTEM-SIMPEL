import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatDateShort, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Search, Calendar , Trash, Printer } from 'lucide-react'

type Income = {
  id: string
  transaction_id: string | null
  category: string
  amount: number
  payment_method: string
  description: string | null
  date: string
  created_by: string | null
  profiles?: { full_name: string | null } | null
  transactions?: { mechanics?: { name: string } | null } | null
  mechanic_name?: string | null
}

export function Income() {
  const { isAdmin, isOwner, user } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ category: '', amount: '', payment_method: 'CASH', description: '', date: new Date().toISOString().split('T')[0] })
  
  const [error, setError] = useState('')

  const { data: incomes = [], isLoading } = useQuery({
    queryKey: ['incomes', dateFilter, startDate, endDate],
    queryFn: async () => {
      let q = supabase.from('incomes').select('*, profiles(full_name)').order('date', { ascending: false }).order('created_at', { ascending: false })
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
      const rows = (data ?? []) as Income[]

      // Ambil nama mekanik untuk baris yang punya transaction_id
      const trxIds = rows.filter(r => r.transaction_id).map(r => r.transaction_id as string)
      if (trxIds.length > 0) {
        const { data: trxData } = await supabase
          .from('transactions')
          .select('id, mechanics(name)')
          .in('id', trxIds)
        if (trxData) {
          const trxMap = Object.fromEntries(trxData.map((t: any) => [t.id, t.mechanics?.name ?? null]))
          rows.forEach(r => {
            if (r.transaction_id) {
              r.mechanic_name = trxMap[r.transaction_id] ?? null
            }
          })
        }
      }
      return rows
    }
  })

  
  const { data: categories = [] } = useQuery({
    queryKey: ['income-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('income_categories').select('name').order('name')
      return (data ?? []).map((c: any) => c.name)
    }
  })

  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes'] })
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        transaction_id: null,
        category: form.category,
        amount: parseFloat(form.amount) || 0,
        payment_method: form.payment_method,
        description: form.description.trim() || null,
        date: form.date,
        created_by: user?.id ?? null
      }
      const { error } = await supabase.from('incomes').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incomes'] })
      setModalOpen(false)
      setForm(prev => ({ category: '', amount: '', payment_method: 'CASH', description: '', date: prev.date }))
    },
    onError: () => setError('Gagal menyimpan data.')
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (parseFloat(form.amount) <= 0) return setError('Nominal harus lebih dari 0.')
    saveMutation.mutate()
  }

  const filtered = incomes.filter(i => 
    i.category.toLowerCase().includes(search.toLowerCase()) || 
    (i.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const todayStr = new Date().toISOString().split('T')[0]
  const todayTotal = incomes.filter(i => i.date === todayStr).reduce((s, i) => s + i.amount, 0)
  const monthTotal = incomes.reduce((s, i) => s + i.amount, 0)
  const manualTotal = incomes.filter(i => !i.transaction_id).reduce((s, i) => s + i.amount, 0)
  const trxTotal = incomes.filter(i => i.transaction_id).reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pemasukan</h1>
          <p className="text-sm text-gray-500 mt-1">Rekap data pemasukan kasir & manual</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Cetak PDF
          </button>
          {(isAdmin || isOwner) && (
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Pemasukan Manual
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Hari Ini</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatRupiah(todayTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Bulan Ini</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatRupiah(monthTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Dari Kasir (Bulan Ini)</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatRupiah(trxTotal)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">Manual (Bulan Ini)</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{formatRupiah(manualTotal)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-white border rounded-lg px-3 py-2 shadow-sm overflow-hidden">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Cari kategori atau keterangan..." className="flex-1 text-sm outline-none bg-transparent min-w-0 w-full" value={search} onChange={e => setSearch(e.target.value)} />
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
          <div className="text-center py-12 text-gray-400 text-sm">Tidak ada data pemasukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Keterangan</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Nominal</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Sumber</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Metode</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, index) => (
                  <tr key={`${i.id}-${index}`} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDateShort(i.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{i.category}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-xs truncate" title={i.description || ''}>{i.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(i.amount)}</td>
                    <td className="px-4 py-3 text-right">{(isOwner || isAdmin) && <button onClick={() => { if(confirm('Yakin hapus data ini?')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}</td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i.transaction_id ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {i.transaction_id ? 'KASIR' : 'MANUAL'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{i.payment_method}</span>
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
              <h2 className="font-semibold text-gray-900">Catat Pemasukan Manual</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Detail tambahan..." />
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Area */}
      <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 overflow-visible text-black text-sm">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Rakyat Sinting Matic Shop</h1>
          <h2 className="text-lg font-semibold mt-1">Laporan Rincian Pemasukan</h2>
          <p className="text-gray-600 mt-1">
            Periode: {dateFilter === 'today' ? formatDateShort(new Date()) : dateFilter === 'month' ? 'Bulan Ini' : dateFilter === 'custom' && startDate && endDate ? `${formatDateShort(new Date(startDate))} - ${formatDateShort(new Date(endDate))}` : 'Semua Waktu'}
          </p>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 px-2 text-left w-24">Tanggal</th>
              <th className="py-2 px-2 text-left w-32">Kategori</th>
              <th className="py-2 px-2 text-left">Keterangan</th>
              <th className="py-2 px-2 text-left w-32">Mekanik</th>
              <th className="py-2 px-2 text-left w-24">Metode</th>
              <th className="py-2 px-2 text-right w-32">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, index) => (
              <tr key={`print-${i.id}-${index}`} className="border-b border-gray-200">
                <td className="py-2 px-2">{formatDateShort(new Date(i.date))}</td>
                <td className="py-2 px-2 font-medium">{i.category}</td>
                <td className="py-2 px-2">{i.description || '-'}</td>
                <td className="py-2 px-2">{i.transactions?.mechanics?.name || i.mechanic_name || '-'}</td>
                <td className="py-2 px-2">{i.payment_method}</td>
                <td className="py-2 px-2 text-right">{formatRupiah(i.amount)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">Belum ada data untuk periode ini</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="flex justify-end mt-8">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span className="font-medium">Total CASH:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'CASH').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total QRIS:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'QRIS').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total TRANSFER:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'TRANSFER').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-black mt-1 font-bold text-lg">
              <span>TOTAL:</span>
              <span>{formatRupiah(filtered.reduce((s, i) => s + i.amount, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
