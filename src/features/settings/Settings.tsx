import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { Trash2, Plus } from 'lucide-react'

function CategoryManager({ title, table }: { title: string; table: string }) {
  const qc = useQueryClient()
  const [newCat, setNewCat] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data } = await supabase.from(table).select('*').order('name')
      return data ?? []
    }
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newCat.trim()) return
    setLoading(true)
    const { error } = await supabase.from(table).insert({ name: newCat.trim() })
    if (error) alert('Gagal: ' + error.message)
    setNewCat('')
    qc.invalidateQueries({ queryKey: [table] })
    qc.invalidateQueries({ queryKey: ['income-categories'] })
    qc.invalidateQueries({ queryKey: ['expense-categories'] })
    qc.invalidateQueries({ queryKey: ['product_categories'] })
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini?')) return
    await supabase.from(table).delete().eq('id', id)
    qc.invalidateQueries({ queryKey: [table] })
    qc.invalidateQueries({ queryKey: ['income-categories'] })
    qc.invalidateQueries({ queryKey: ['expense-categories'] })
    qc.invalidateQueries({ queryKey: ['product_categories'] })
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          placeholder="Tambah kategori..."
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50">
          <Plus className="h-4 w-4" />
        </button>
      </form>
      <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
        {categories.length === 0 ? (
          <p className="p-3 text-xs text-gray-500 text-center">Belum ada kategori</p>
        ) : categories.map((c: any) => (
          <div key={c.id} className="flex items-center justify-between p-2.5 hover:bg-gray-50">
            <span className="text-sm text-gray-700">{c.name}</span>
            <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-md">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Settings() {
  const { profile, user, isAdmin } = useAuth()
  const qc = useQueryClient()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3500)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user!.id)
    setSaving(false)
    if (error) showAlert('error', 'Gagal menyimpan profil.')
    else {
      qc.invalidateQueries({ queryKey: ['profile'] })
      showAlert('success', 'Profil berhasil diperbarui.')
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPw.length < 6) return setPwError('Password baru minimal 6 karakter.')
    if (pwForm.newPw !== pwForm.confirm) return setPwError('Konfirmasi password tidak cocok.')
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    setPwSaving(false)
    if (error) setPwError('Gagal mengubah password: ' + error.message)
    else {
      setPwForm({ current: '', newPw: '', confirm: '' })
      showAlert('success', 'Password berhasil diubah.')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {alert && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{alert.msg}</div>
      )}

      <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>

      {/* Profile */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Profil Pengguna</h2>
          <p className="text-xs text-gray-500 mt-0.5">Informasi akun Anda</p>
        </div>
        <form onSubmit={saveProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Nama lengkap Anda"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${isAdmin ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {isAdmin ? 'ADMIN' : 'KASIR'}
              </span>
              <p className="text-xs text-gray-400">{isAdmin ? 'Akses penuh ke semua fitur' : 'Akses terbatas ke Kasir & Transaksi'}</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Ubah Password</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ganti password akun Anda</p>
        </div>
        <form onSubmit={changePassword} className="p-5 space-y-4">
          {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{pwError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ketik ulang password baru"
            />
          </div>
          <div className="pt-2 border-t">
            <button type="submit" disabled={pwSaving} className="px-5 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60">
              {pwSaving ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Category Management */}
      {isAdmin && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Kelola Kategori</h2>
            <p className="text-xs text-gray-500 mt-0.5">Atur kategori untuk pemasukan dan pengeluaran manual</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <CategoryManager title="Kategori Pemasukan" table="income_categories" />
            <CategoryManager title="Kategori Pengeluaran" table="expense_categories" />
            <CategoryManager title="Kategori Produk" table="product_categories" />
          </div>
        </div>
      )}

      {/* App Info */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Informasi Aplikasi</h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nama Aplikasi</span>
            <span className="font-medium text-gray-900">RSMS Sistem Simpel</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Versi</span>
            <span className="font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bengkel</span>
            <span className="font-medium text-gray-900">Rakyat Sinting Matic Shop</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Database</span>
            <span className="font-medium text-green-600">● Terhubung (Supabase)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
