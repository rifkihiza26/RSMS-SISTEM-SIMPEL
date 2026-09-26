const fs = require('fs')
let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Supabase relations usually return array or object. With (name) it's usually { name: string } or { name: string }[]
content = content.replace(
  `product_categories?: { name: string } | null`,
  `product_categories?: { name: string } | { name: string }[] | null`
)

content = content.replace(
  `p.product_categories?.name`,
  `((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) || '')`
)

content = content.replace(
  `p.product_categories?.name === categoryFilter`,
  `((Array.isArray(p.product_categories) ? p.product_categories[0]?.name : p.product_categories?.name) === categoryFilter)`
)

content = content.replace(
  `cat === 'Semua' ? '' : cat`,
  `cat === 'Semua' ? '' : (cat || '')`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
