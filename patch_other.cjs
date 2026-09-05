const fs = require('fs');

function patchFile(file, imports, replaces) {
  let code = fs.readFileSync(file, 'utf8');
  if(imports) {
     code = code.replace(/import \{ formatRupiah(.*?) \} from '@\/lib\/utils'/, "import { formatRupiah$1, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'");
  }
  replaces.forEach(r => { code = code.replace(r[0], r[1]) });
  fs.writeFileSync(file, code);
}

// 1. Products.tsx
patchFile('src/features/products/Products.tsx', true, [
  [
    /<input type="number" min="0" value=\{form\.cost_price\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, cost_price: e\.target\.value \}\)\)\}/g,
    '<input type="text" value={formatCurrencyInput(form.cost_price)} onChange={e => setForm(f => ({ ...f, cost_price: parseCurrencyInput(e.target.value) }))}'
  ],
  [
    /<input type="number" min="0" value=\{form\.selling_price\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, selling_price: e\.target\.value \}\)\)\}/g,
    '<input type="text" value={formatCurrencyInput(form.selling_price)} onChange={e => setForm(f => ({ ...f, selling_price: parseCurrencyInput(e.target.value) }))}'
  ]
]);

// 2. Services.tsx
patchFile('src/features/services/Services.tsx', true, [
  [
    /<input type="number" min="0" value=\{form\.selling_price\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, selling_price: e\.target\.value \}\)\)\}/g,
    '<input type="text" value={formatCurrencyInput(form.selling_price)} onChange={e => setForm(f => ({ ...f, selling_price: parseCurrencyInput(e.target.value) }))}'
  ]
]);

// 3. Income.tsx
patchFile('src/features/income/Income.tsx', true, [
  [
    /<input type="number" min="0" value=\{form\.amount\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, amount: e\.target\.value \}\)\)\}/g,
    '<input type="text" value={formatCurrencyInput(form.amount)} onChange={e => setForm(f => ({ ...f, amount: parseCurrencyInput(e.target.value) }))}'
  ]
]);

// 4. Expenses.tsx
patchFile('src/features/expenses/Expenses.tsx', true, [
  [
    /<input type="number" min="0" value=\{form\.amount\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, amount: e\.target\.value \}\)\)\}/g,
    '<input type="text" value={formatCurrencyInput(form.amount)} onChange={e => setForm(f => ({ ...f, amount: parseCurrencyInput(e.target.value) }))}'
  ]
]);

