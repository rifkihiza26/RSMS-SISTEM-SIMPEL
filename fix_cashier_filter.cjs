const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Fix type Product
content = content.replace(
  `type Product = { id: string; sku: string; name: string; selling_price: number; stock: number; brand: string | null; category: string | null }`,
  `type Product = { id: string; sku: string; name: string; selling_price: number; stock: number; brand: string | null; product_categories?: { name: string } | null }`
)

// Fix product query
content = content.replace(
  `select('id,sku,name,selling_price,stock,brand,category')`,
  `select('id,sku,name,selling_price,stock,brand,product_categories(name)')`
)

// Fix service query
content = content.replace(
  `select('id,service_code,name,selling_price,category')`,
  `select('id,service_code,name,selling_price')`
)

// Fix logic productCategories
content = content.replace(
  `const productCategories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]`,
  `const productCategories = ['Semua', ...Array.from(new Set(products.map(p => p.product_categories?.name).filter(Boolean)))]`
)

// Fix logic serviceCategories
content = content.replace(
  `const serviceCategories = ['Semua', ...Array.from(new Set(services.map((s: any) => s.category).filter(Boolean)))]`,
  `const serviceCategories = ['Semua']` // Jasa tidak punya kategori
)

// Fix filter category in filteredProducts
content = content.replace(
  `const matchCategory = !categoryFilter || categoryFilter === 'Semua' || p.category === categoryFilter`,
  `const matchCategory = !categoryFilter || categoryFilter === 'Semua' || p.product_categories?.name === categoryFilter`
)

// Fix filter category in filteredServices
content = content.replace(
  `const matchCategory = !categoryFilter || categoryFilter === 'Semua' || s.category === categoryFilter`,
  `const matchCategory = true` // Jasa selalu true untuk kategori apapun karena tidak ada kategori
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
