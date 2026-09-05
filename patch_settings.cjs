const fs = require('fs');

let code = fs.readFileSync('src/features/settings/Settings.tsx', 'utf8');

// Add Lucide icons
code = code.replace(
  /import \{ useNavigate \} from '@tanstack\/react-router'/,
  "import { useNavigate } from '@tanstack/react-router'\nimport { Trash2, Plus } from 'lucide-react'"
);

const categoriesCode = `
      {/* Category Management */}
      {isAdmin && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Kelola Kategori</h2>
            <p className="text-xs text-gray-500 mt-0.5">Atur kategori untuk pemasukan dan pengeluaran manual</p>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryManager title="Kategori Pemasukan" table="income_categories" />
            <CategoryManager title="Kategori Pengeluaran" table="expense_categories" />
          </div>
        </div>
      )}
`;

code = code.replace(
  /\{ \/\* App Info \*\/ \}/,
  categoriesCode + '\n\n      {/* App Info */}'
);

const componentCode = `
import { useQuery } from '@tanstack/react-query'

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
    await supabase.from(table).insert({ name: newCat.trim() })
    setNewCat('')
    qc.invalidateQueries({ queryKey: [table] })
    qc.invalidateQueries({ queryKey: ['income-categories'] })
    qc.invalidateQueries({ queryKey: ['expense-categories'] })
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini?')) return
    await supabase.from(table).delete().eq('id', id)
    qc.invalidateQueries({ queryKey: [table] })
    qc.invalidateQueries({ queryKey: ['income-categories'] })
    qc.invalidateQueries({ queryKey: ['expense-categories'] })
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
`;

code = code + componentCode;

fs.writeFileSync('src/features/settings/Settings.tsx', code);
