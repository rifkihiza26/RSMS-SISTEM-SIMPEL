const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Tambah state categoryFilter
content = content.replace(
  "const [motorType, setMotorType] = useState('')",
  "const [motorType, setMotorType] = useState('')\n  const [categoryFilter, setCategoryFilter] = useState('')"
)

// 2. Update filteredProducts untuk menyertakan filter kategori
content = content.replace(
  `  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
  )`,
  `  // Kumpulkan daftar kategori unik dari produk
  const productCategories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const serviceCategories = ['Semua', ...Array.from(new Set(services.map((s: any) => s.category).filter(Boolean)))]

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || categoryFilter === 'Semua' || p.category === categoryFilter
    return matchSearch && matchCategory
  })`
)

// 3. Update filteredServices untuk menyertakan filter kategori
content = content.replace(
  `  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.service_code.toLowerCase().includes(search.toLowerCase())
  )`,
  `  const filteredServices = services.filter((s: any) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.service_code.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || categoryFilter === 'Semua' || s.category === categoryFilter
    return matchSearch && matchCategory
  })`
)

// 4. Reset category filter saat ganti tab
content = content.replace(
  `onClick={() => setTab('PRODUCT')} className`,
  `onClick={() => { setTab('PRODUCT'); setCategoryFilter('') }} className`
)
content = content.replace(
  `onClick={() => setTab('SERVICE')} className`,
  `onClick={() => { setTab('SERVICE'); setCategoryFilter('') }} className`
)

// 5. Tambahkan chip filter kategori setelah tombol tab PRODUCT/SERVICE
const filterChipsCode = `
        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(tab === 'PRODUCT' ? productCategories : serviceCategories).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === 'Semua' ? '' : cat)}
              className={\`px-3 py-1 rounded-full text-xs font-semibold border transition-colors \${
                (cat === 'Semua' && !categoryFilter) || categoryFilter === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>
`

// Insert filter chips after the tab buttons div
content = content.replace(
  `        </div>\n\n        <div className="grid grid-cols-2`,
  `        </div>\n${filterChipsCode}\n        <div className="grid grid-cols-2`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
console.log('Done!')
