const fs = require('fs');
let code = fs.readFileSync('src/features/settings/Settings.tsx', 'utf8');

code = code.replace(
  /<CategoryManager title="Kategori Pengeluaran" table="expense_categories" \/>/g,
  `<CategoryManager title="Kategori Pengeluaran" table="expense_categories" />\n            <CategoryManager title="Kategori Produk" table="product_categories" />`
);

code = code.replace(
  /grid-cols-1 md:grid-cols-2/g,
  'grid-cols-1 md:grid-cols-3'
);

// update invalidation queries in CategoryManager
code = code.replace(
  /qc\.invalidateQueries\(\{ queryKey: \['expense-categories'\] \}\)/g,
  `qc.invalidateQueries({ queryKey: ['expense-categories'] })\n    qc.invalidateQueries({ queryKey: ['product_categories'] })`
);

fs.writeFileSync('src/features/settings/Settings.tsx', code);
