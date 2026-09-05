const fs = require('fs');
let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

// import formatCurrencyInput, parseCurrencyInput
code = code.replace(/import \{ formatRupiah, generateTransactionNumber \} from '@\/lib\/utils'/, "import { formatRupiah, generateTransactionNumber, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'");

// Patch discount input
code = code.replace(
  /<input type="number" min="0" value=\{discount \|\| ''\} placeholder="0"\s*onChange=\{e => setDiscount\(parseFloat\(e\.target\.value\) \|\| 0\)\}/g,
  '<input type="text" value={discount ? formatCurrencyInput(discount) : ""} placeholder="0"\n              onChange={e => setDiscount(parseFloat(parseCurrencyInput(e.target.value)) || 0)}'
);

// Patch paidAmount input
code = code.replace(
  /<input type="number" min=\{total\} value=\{paidAmount \|\| ''\}\s*onChange=\{e => setPaidAmount\(parseFloat\(e\.target\.value\) \|\| 0\)\}/g,
  '<input type="text" value={paidAmount ? formatCurrencyInput(paidAmount) : ""} \n                  onChange={e => setPaidAmount(parseFloat(parseCurrencyInput(e.target.value)) || 0)}'
);

// Patch manualForm.price input
code = code.replace(
  /<input type="number" min="0" value=\{manualForm\.price\} onChange=\{e => setManualForm\(f => \(\{ \.\.\.f, price: e\.target\.value \}\)\)\}/g,
  '<input type="text" value={formatCurrencyInput(manualForm.price)} onChange={e => setManualForm(f => ({ ...f, price: parseCurrencyInput(e.target.value) }))}'
);

// Conditional qty for manual input
code = code.replace(
  /<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Qty<\/label>\s*<input type="number" min="1" value=\{manualForm\.qty\} onChange=\{e => setManualForm\(f => \(\{ \.\.\.f, qty: e\.target\.value \}\)\)\} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary\/40" \/>\s*<\/div>/g,
  `{manualForm.type === 'Barang' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                    <input type="number" min="1" value={manualForm.qty} onChange={e => setManualForm(f => ({ ...f, qty: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                )}`
);

// Fix grid cols when qty is hidden
code = code.replace(
  /<div className="grid grid-cols-2 gap-3">/g,
  `<div className={\`grid \${manualForm.type === 'Barang' ? 'grid-cols-2' : 'grid-cols-1'} gap-3\`}>`
);

fs.writeFileSync('src/features/cashier/Cashier.tsx', code);
