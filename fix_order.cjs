const fs = require('fs')

function fixProducts() {
  let content = fs.readFileSync('src/features/products/Products.tsx', 'utf8')
  content = content.replace(
    /supabase\.from\('product_categories'\)\.select\('\*'\)\.order\('sku'\)/g,
    "supabase.from('product_categories').select('*').order('name')"
  )
  fs.writeFileSync('src/features/products/Products.tsx', content)
}

function fixServices() {
  let content = fs.readFileSync('src/features/services/Services.tsx', 'utf8')
  content = content.replace(
    /supabase\.from\('service_categories'\)\.select\('\*'\)\.order\('sku'\)/g,
    "supabase.from('service_categories').select('*').order('name')"
  )
  fs.writeFileSync('src/features/services/Services.tsx', content)
}

fixProducts()
fixServices()
console.log('Fixed categories query')
