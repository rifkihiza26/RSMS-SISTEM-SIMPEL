const fs = require('fs')

let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Add is_service to CartItem
code = code.replace(
  `  max_stock?: number\n}`,
  `  max_stock?: number\n  is_service: boolean\n}`
)

// Update addProduct
code = code.replace(
  `{ id: crypto.randomUUID(), name: p.name, type: 'PRODUCT', price: p.selling_price, qty: 1, product_id: p.id, sku: p.sku, max_stock: p.stock }`,
  `{ id: crypto.randomUUID(), name: p.name, type: 'PRODUCT', price: p.selling_price, qty: 1, product_id: p.id, sku: p.sku, max_stock: p.stock, is_service: false }`
)

// Update addService
code = code.replace(
  `{ id: crypto.randomUUID(), name: s.name, type: 'SERVICE', price: s.selling_price, qty: 1, service_id: s.id, sku: s.service_code }`,
  `{ id: crypto.randomUUID(), name: s.name, type: 'SERVICE', price: s.selling_price, qty: 1, service_id: s.id, sku: s.service_code, is_service: true }`
)

// Update addManual
code = code.replace(
  `{ id: crypto.randomUUID(), name: manualForm.name.trim(), type: 'MANUAL', price, qty }`,
  `{ id: crypto.randomUUID(), name: manualForm.name.trim(), type: 'MANUAL', price, qty, is_service: manualForm.type === 'Jasa' }`
)

// Update payload in completeTransaction
code = code.replace(
  `      subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT',
    }))`,
  `      subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT',
      is_service: i.is_service,
    }))`
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', code)
console.log('Cashier is_service patched!')
