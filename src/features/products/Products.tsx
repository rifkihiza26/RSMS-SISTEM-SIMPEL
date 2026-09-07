import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatRupiah, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react'

type Product = {
  id: string
  sku: string
  name: string
  category_id: string | null
  brand: string | null
  unit: string | null
  cost_price: number
  selling_price: number
  stock: number
  minimum_stock: number
  status: string
  product_categories?: { name: string } | null
}

type Category = { id: string; name: string }

type FormData = {
  sku: string; name: string; category_id: string; brand: string; unit: string
  cost_price: string; selling_price: string; stock: string; minimum_stock: string; status: string
}

const emptyForm: FormData = {
  sku: '', name: '', category_id: '', brand: '', unit: 'pcs',
  cost_price: '0', selling_price: '0', stock: '0', minimum_stock: '0', status: 'ACTIVE'
}

export function Products() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .order('name')
      if (error) { console.error(error); throw error }
      return data as Product[]
    }
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product_categories'],
    queryFn: async () => {
      const { data } = await supabase.from('product_categories').select('*').order('name')
      return (data ?? []) as Category[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        sku: data.sku.trim(),
        name: data.name.trim(),
        category_id: data.category_id || null,
        brand: data.brand.trim() || null,
        unit: data.unit.trim() || null,
        cost_price: parseFloat(data.cost_price) || 0,
        selling_price: parseFloat(data.selling_price) || 0,
        stock: parseInt(data.stock) || 0,
        minimum_stock: parseInt(data.minimum_stock) || 0,
        status: data.status,
      }
      if (editItem) {
        const { error } = await supabase.from('products').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editItem.id)
        if (error) { console.error(error); throw error }
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) { console.error(error); throw error }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      closeModal()
      showAlert('success', editItem ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
    },
    onError: (err: Error) => {
      if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setFormError('SKU sudah digunakan. Gunakan SKU yang berbeda.')
      } else {
        setFormError('Gagal: ' + (err.message || 'Unknown error'))
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) { console.error(error); throw error }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteId(null)
      showAlert('success', 'Produk berhasil dihapus.')
    },
    onError: () => showAlert('error', 'Produk tidak dapat dihapus karena sudah digunakan dalam transaksi.')
  })

  function showAlert(type: 'success' | 'error', msg: string) {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 3500)
  }

  function openAdd() {
    setEditItem(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditItem(p)
    setForm({
      sku: p.sku, name: p.name, category_id: p.category_id ?? '',
      brand: p.brand ?? '', unit: p.unit ?? 'pcs',
      cost_price: String(p.cost_price), selling_price: String(p.selling_price),
      stock: String(p.stock), minimum_stock: String(p.minimum_stock), status: p.status
    })
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
    if (!form.sku.trim()) return setFormError('SKU wajib diisi.')
    if (!form.name.trim()) return setFormError('Nama produk wajib diisi.')
    if (parseFloat(form.selling_price) <= 0) return setFormError('Harga jual harus lebih dari 0.')
    saveMutation.mutate(form)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function stockBadge(p: Product) {
    if (p.stock === 0) return <span className="text-[11px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">HABIS</span>
    if (p.stock <= p.minimum_stock) return <span className="text-[11px] font-semibold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">MENIPIS</span>
    return <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AMAN</span>
  }

  return (
    <div className="space-y-4">
      {alert && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>{alert.msg}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
        {isAdmin && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 shadow-sm">
        <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="text" placeholder="Cari nama, SKU, atau brand..."
          className="flex-1 text-sm outline-none bg-transparent min-w-0 w-full"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {search ? 'Produk tidak ditemukan.' : 'Belum ada produk. Tambahkan produk baru.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">SKU</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama Produk</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Kategori</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Stok</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Harga Modal</th>}
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Harga Jual</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  {isAdmin && <th className="text-right px-4 py-3 font-semibold text-gray-600">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.name}
                      {p.brand && <span className="ml-1.5 text-[11px] text-gray-400">{p.brand}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{p.product_categories?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-semibold text-gray-900">{p.stock}</span>
                        {stockBadge(p)}
                      </div>
                    </td>
                    {isAdmin && <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">{formatRupiah(p.cost_price)}</td>}
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(p.selling_price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">{editItem ? 'Edit Produk' : 'Tambah Produk'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU <span className="text-red-500">*</span></label>
                  <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="SP-CVT-0001" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="V-Belt Honda Beat" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="">— Pilih Kategori —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Honda" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="pcs" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal (Rp)</label>
                  <input type="text" value={formatCurrencyInput(form.cost_price)} onChange={e => setForm(f => ({ ...f, cost_price: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual (Rp) <span className="text-red-500">*</span></label>
                  <input type="text" value={formatCurrencyInput(form.selling_price)} onChange={e => setForm(f => ({ ...f, selling_price: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Saat Ini</label>
                  <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimum</label>
                  <input type="number" min="0" value={form.minimum_stock} onChange={e => setForm(f => ({ ...f, minimum_stock: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
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

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4"><AlertTriangle className="h-10 w-10 text-red-500" /></div>
            <h3 className="font-semibold text-gray-900 mb-2">Hapus Produk?</h3>
            <p className="text-sm text-gray-500 mb-5">Produk yang sudah digunakan dalam transaksi tidak dapat dihapus.</p>
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
