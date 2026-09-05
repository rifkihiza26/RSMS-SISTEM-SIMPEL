const fs = require('fs');

// --- Patch Income.tsx ---
let incomeCode = fs.readFileSync('src/features/income/Income.tsx', 'utf8');

// Initialize form category empty
incomeCode = incomeCode.replace(
  /const \[form, setForm\] = useState\(\{ category: 'Penjualan Sparepart',/g,
  "const [form, setForm] = useState({ category: '',"
);
incomeCode = incomeCode.replace(
  /setForm\(\{ category: 'Penjualan Sparepart',/g,
  "setForm({ category: '',"
);

// Add query for categories
const incomeQueryStr = `
  const { data: categories = [] } = useQuery({
    queryKey: ['income-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('income_categories').select('name').order('name')
      return (data ?? []).map((c: any) => c.name)
    }
  })
`;
incomeCode = incomeCode.replace(
  /const saveMutation = useMutation\(\{/g,
  incomeQueryStr + "\n  const saveMutation = useMutation({"
);

// Replace hardcoded select
incomeCode = incomeCode.replace(
  /<select value=\{form\.category\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, category: e\.target\.value \}\)\)\} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary\/40">\s*<option value="Penjualan Sparepart">Penjualan Sparepart \(Luar Kasir\)<\/option>\s*<option value="Jasa Service">Jasa Service \(Luar Kasir\)<\/option>\s*<option value="Lainnya">Lainnya<\/option>\s*<\/select>/g,
  `<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">— Pilih Kategori —</option>
                  {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>`
);

// Add validation for category
incomeCode = incomeCode.replace(
  /if \(parseFloat\(parseCurrencyInput\(form\.amount\)\) <= 0\) return setError\('Nominal harus lebih dari 0\.'\)/g,
  "if (!form.category) return setError('Kategori wajib dipilih.')\n    if (parseFloat(parseCurrencyInput(form.amount)) <= 0) return setError('Nominal harus lebih dari 0.')"
);

fs.writeFileSync('src/features/income/Income.tsx', incomeCode);


// --- Patch Expenses.tsx ---
let expenseCode = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8');

// Initialize form category empty
expenseCode = expenseCode.replace(
  /const CATEGORIES = \['Belanja Sparepart', 'Gaji Mekanik', 'Listrik', 'Air', 'Operasional', 'Lainnya'\]\n/g,
  ""
);
expenseCode = expenseCode.replace(
  /const \[form, setForm\] = useState\(\{ category: 'Operasional',/g,
  "const [form, setForm] = useState({ category: '',"
);
expenseCode = expenseCode.replace(
  /setForm\(\{ category: 'Operasional',/g,
  "setForm({ category: '',"
);

// Add query for categories
const expenseQueryStr = `
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('expense_categories').select('name').order('name')
      return (data ?? []).map((c: any) => c.name)
    }
  })
`;
expenseCode = expenseCode.replace(
  /const \{ data: mechanics = \[\] \} = useQuery\(\{/g,
  expenseQueryStr + "\n  const { data: mechanics = [] } = useQuery({"
);

// Replace hardcoded select
expenseCode = expenseCode.replace(
  /<select value=\{form\.category\} onChange=\{e => setForm\(f => \(\{ \.\.\.f, category: e\.target\.value \}\)\)\} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary\/40">\s*\{CATEGORIES\.map\(c => <option key=\{c\} value=\{c\}>\{c\}<\/option>\)\}\s*<\/select>/g,
  `<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="">— Pilih Kategori —</option>
                  {categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>`
);

// Add validation for category
expenseCode = expenseCode.replace(
  /if \(parseFloat\(parseCurrencyInput\(form\.amount\)\) <= 0\) return setError\('Nominal harus lebih dari 0\.'\)/g,
  "if (!form.category) return setError('Kategori wajib dipilih.')\n    if (parseFloat(parseCurrencyInput(form.amount)) <= 0) return setError('Nominal harus lebih dari 0.')"
);

fs.writeFileSync('src/features/expenses/Expenses.tsx', expenseCode);
