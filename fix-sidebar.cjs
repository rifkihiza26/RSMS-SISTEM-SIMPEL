const fs = require('fs');
let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf-8');

if (!content.includes('href: \'/recaps\'')) {
  // Add icon import (ClipboardList or something)
  content = content.replace('Receipt,', 'Receipt, ClipboardList,');
  
  // Insert Rekapan after Kasir
  content = content.replace(
    "{ name: 'Kasir',       href: '/cashier',      icon: ShoppingCart,    roles: ['ADMIN', 'KASIR'] },",
    "{ name: 'Kasir',       href: '/cashier',      icon: ShoppingCart,    roles: ['ADMIN', 'KASIR'] },\n  { name: 'Rekapan',     href: '/recaps',       icon: ClipboardList,   roles: ['ADMIN', 'OWNER'] },"
  );
  
  fs.writeFileSync('src/layouts/AppLayout.tsx', content);
}
