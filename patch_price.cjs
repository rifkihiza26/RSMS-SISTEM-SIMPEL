const fs = require('fs')
let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Fix interfaces
c = c.replace('interface Product {\n  id: string; name: string; sku: string; price: number; stock: number; category: string;\n}', 
              'interface Product {\n  id: string; name: string; sku: string; selling_price: number; stock: number; category: string;\n}')
c = c.replace('interface Service {\n  id: string; name: string; code: string; price: number; category: string;\n}', 
              'interface Service {\n  id: string; name: string; code: string; selling_price: number; category: string;\n}')

// Fix render for Products
c = c.replace(/p\.price\.toLocaleString/g, 'p.selling_price.toLocaleString')
c = c.replace(/p\.price/g, 'p.selling_price')

// Fix render for Services
c = c.replace(/s\.price\.toLocaleString/g, 's.selling_price.toLocaleString')
c = c.replace(/s\.price/g, 's.selling_price')

// Also fix code logic (s.code doesn't exist, it's s.service_code!)
c = c.replace(/code: string;/g, 'service_code: string;')
c = c.replace(/s\.code/g, 's.service_code')

// Fix addToCart logic
c = c.replace(/price: item\.price/g, 'price: item.selling_price')
c = c.replace(/sku: type === 'PRODUCT' \? item\.sku : undefined/g, "sku: type === 'PRODUCT' ? item.sku : item.service_code")

fs.writeFileSync('src/features/cashier/Cashier.tsx', c)
console.log('Price and code fields patched')
