const fs = require('fs');
let code = fs.readFileSync('src/features/products/Products.tsx', 'utf8');

code = code.replace(
  /setFormError\('Data gagal disimpan\. Coba lagi\.'\)/g,
  "setFormError('Gagal: ' + (err.message || 'Unknown error'))"
);

fs.writeFileSync('src/features/products/Products.tsx', code);
