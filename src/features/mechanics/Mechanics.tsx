import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Edit2, Trash2, X, AlertTriangle, Phone } from 'lucide-react'

type Mechanic = { id: string; name: string; phone: string | null; status: string }
type FormData = { name: string; phone: string; status: string }
const emptyForm: FormData = { name: '', phone: '', status: 'ACTIVE' }

export function Mechanics() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Mechanic | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: mechanics = [], isLoading } = useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('*').order('name')
      return (data ?? []) as Mechanic[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { name: data.name.trim(), phone: data.phone.trim() || null, status: data.status }
      if (editItem) {
        const { error } = await supabase.from('mechanics').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('mechanics').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mechanics'] })
      closeModal()
      showAlert('success', editItem ? 'Mekanik berhasil diperbarui.' : 'Mekanik berhasil ditambahkan.')
    },
    onError: () => setFormError('Data gagal disimpan.')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mechanics').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mechanics'] }); setDeleteId(null); showAlert('success', 'Mekanik berhasil dihapus.') },
    onError: () => showAlert('error', 'Mekanik tidak dapat dihapus karena sudah digunakan.')
  })

  function showAlert(type: 'success' | 'error', msg: string) { setAlert({ type, msg }); setTimeout(() => setAlert(null), 3500) }
  function openAdd() { setEditItem(null); setForm(emptyForm); setFormError(''); setModalOpen(true) }
  function openEdit(m: Mechanic) { setEditItem(m); setForm({ name: m.name, phone: m.phone ?? '', status: m.status }); setFormError(''); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditItem(null); setForm(emptyForm); setFormError('') }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('')
    if (!form.name.trim()) return setFormError('Nama mekanik wajib diisi.')
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-4">
      {alert && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{alert.msg}</div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mekanik</h1>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah Mekanik
          </button>
        )}
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : mechanics.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Belum ada mekanik terdaftar.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama Mekanik</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">No. HP</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                {isAdmin && <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {mechanics.map(m => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {m.phone ? <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{m.phone}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(m.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
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
              <h2 className="font-semibold text-gray-900">{editItem ? 'Edit Mekanik' : 'Tambah Mekanik'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Andi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. HP</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="0812-xxxx-xxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
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
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Mekanik?</h3>
            <p className="text-sm text-gray-500 mb-5">Tindakan ini tidak dapat dibatalkan.</p>
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
