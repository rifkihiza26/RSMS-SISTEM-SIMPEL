const fs = require('fs');
let content = fs.readFileSync('src/features/payroll/Payroll.tsx', 'utf-8');

// 1. Add imports: useQueryClient, Save
content = content.replace(
  "import { useQuery } from '@tanstack/react-query'",
  "import { useQuery, useQueryClient } from '@tanstack/react-query'"
);
content = content.replace(
  "import { Users, Printer } from 'lucide-react'",
  "import { Users, Printer, Save } from 'lucide-react'\nimport { generateExpenseNumber } from '@/lib/utils'\nimport { useAuth } from '@/contexts/AuthContext'"
);

// 2. Add qc and user
content = content.replace(
  "export function Payroll() {",
  "export function Payroll() {\n  const qc = useQueryClient()\n  const { user } = useAuth()\n  const [saving, setSaving] = useState(false)"
);

// 3. Add handleSave function
const handleSaveCode = `
  const handleSave = async () => {
    if (!confirm('Simpan penggajian ini ke tabel Pengeluaran?')) return;
    setSaving(true);
    try {
      const mechName = mechanics.find(m => m.id === selectedMechanic)?.name;
      const desc = \`Gaji \${mechName} periode \${dateFrom} - \${dateTo} (\${percentage}% + Makan)\`;
      
      const { error } = await supabase.from('expenses').insert({
        expense_number: generateExpenseNumber(),
        category: 'PENGGAJIAN',
        mechanic_id: selectedMechanic,
        amount: totalGajiBersih,
        payment_method: 'CASH',
        description: desc,
        date: new Date().toISOString().split('T')[0],
        created_by: user?.id ?? null
      });

      if (error) throw error;
      alert('Berhasil disimpan ke pengeluaran!');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    }
    setSaving(false);
  }
`;

content = content.replace(
  "  const handlePrint = () => {",
  handleSaveCode + "\n  const handlePrint = () => {"
);

// 4. Add the button in UI
content = content.replace(
  '<button onClick={handlePrint} className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5">',
  `<button onClick={handleSave} disabled={saving || totalGajiBersih <= 0} className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5">
    <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Bayar & Simpan'}
  </button>\n  <button onClick={handlePrint} className="text-sm bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg flex items-center gap-1.5">`
);

fs.writeFileSync('src/features/payroll/Payroll.tsx', content);
