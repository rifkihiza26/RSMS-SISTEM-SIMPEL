import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'

type Service = { id: string; service_code: string; name: string; selling_price: number; active: boolean }
type FormData = { service_code: string; name: string; selling_price: string; active: boolean }
const emptyForm: FormData = { service_code: '', name: '', selling_price: '0', active: true }

export function Services() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Service | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*').order('name')
      return (data ?? []) as Service[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        service_code: data.service_code.trim(),
        name: data.name.trim(),
        selling_price: parseFloat(data.selling_price) || 0,
        active: data.active,
      }
      if (editItem) {
        const { error } = await supabase.from('services').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      closeModal()
      showAlert('success', editItem ? 'Jasa berhasil diperbarui.' : 'Jasa berhasil ditambahkan.')
    },
    onError: (err: Error) => {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setFormError('Kode jasa sudah digunakan.')
      } else {
        setFormError('Data gagal disimpan.')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      setDeleteId(null)
      showAlert('success', 'Jasa berhasil dihapus.')
    },
    onError: () => showAlert('error', 'Jasa tidak dapat dihapus karena sudah digunakan dalam transaksi.')
  })

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3500)
  }

  function openAdd() {
    setEditItem(null)
    const nextCode = `SRV-${String(services.length + 1).padStart(3, '0')}`
    setForm({ ...emptyForm, service_code: nextCode })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(s: Service) {
    setEditItem(s)
    setForm({ service_code: s.service_code, name: s.name, selling_price: String(s.selling_price), active: s.active })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditItem(null)
    setForm(emptyForm)
    setFormError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.service_code.trim()) return setFormError('Kode jasa wajib diisi.')
    if (!form.name.trim()) return setFormError('Nama jasa wajib diisi.')
    if (parseFloat(form.selling_price) <= 0) return setFormError('Harga harus lebih dari 0.')
    saveMutation.mutate(form)
  }

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.service_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {alert && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>{alert.msg}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Jasa</h1>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah Jasa
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Cari nama atau kode jasa..." className="flex-1 text-sm outline-none bg-transparent min-w-0 w-full" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Belum ada jasa. Tambahkan jasa baru.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kode Jasa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama Jasa</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Harga</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                {isAdmin && <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.service_code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(s.selling_price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">{editItem ? 'Edit Jasa' : 'Tambah Jasa'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Jasa <span className="text-red-500">*</span></label>
                <input value={form.service_code} onChange={e => setForm(f => ({ ...f, service_code: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="SRV-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Jasa <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Service CVT" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
                <input type="text" value={formatCurrencyInput(form.selling_price)} onChange={e => setForm(f => ({ ...f, selling_price: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="h-4 w-4 accent-primary" />
                <label htmlFor="active" className="text-sm text-gray-700">Jasa Aktif</label>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Jasa?</h3>
            <p className="text-sm text-gray-500 mb-5">Jasa yang sudah digunakan dalam transaksi tidak dapat dihapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
