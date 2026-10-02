const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldLogic = `  const totalPengeluaran = expenses.reduce((s, e) => s + e.amount, 0)
  const untungParts = totalPartAll - totalModal
  const totalPemasukanKotor = totalJasaAll + totalPartAll + totalKasir
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;

const newLogic = `  const isBelanja = (cat: string) => cat && cat.toLowerCase().includes('belanja') && (cat.toLowerCase().includes('part') || cat.toLowerCase().includes('stok'));
  const pengeluaranBelanjaParts = expenses.filter(e => isBelanja(e.category)).reduce((s, e) => s + e.amount, 0);
  const pengeluaranOperasional = expenses.filter(e => !isBelanja(e.category)).reduce((s, e) => s + e.amount, 0);
  
  const totalPengeluaran = pengeluaranOperasional; // Use this variable name for existing UI (so it means Operasional only)
  
  const untungParts = totalPartAll - totalModal
  const totalPemasukanKotor = totalJasaAll + totalPartAll + totalKasir
  const labaRekapan = totalJasaAll + untungParts + totalKasir - pengeluaranOperasional`;

code = code.replace(oldLogic, newLogic);

// Now we need to add the Belanja Parts info to the UI and PDF
// In UI, we can add a small text or another card.
// Let's modify the UI summary row 2:
const oldRow2 = `      {/* Baris Selisih & Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            ].map(c => (
              <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>`;

const newRow2 = `      {/* Baris Selisih & Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Pengeluaran Ops & Gaji', value: formatRupiah(pengeluaranOperasional), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Belanja Stok (Info)', value: formatRupiah(pengeluaranBelanjaParts), color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
              { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            ].map(c => (
              <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>`;

code = code.replace(oldRow2, newRow2);

// PDF HTML Logic
const oldPdfExpense = `            <tr><td style="padding:7px 0; color:#555;">Pengeluaran</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalPengeluaran)}</td></tr>`;
const newPdfExpense = `            <tr><td style="padding:7px 0; color:#555;">Pengeluaran Ops & Gaji</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(pengeluaranOperasional)}</td></tr>
            \${pengeluaranBelanjaParts > 0 ? \`<tr><td style="padding:7px 0; color:#888;">(Info: Uang keluar utk Belanja Stok)</td><td style="text-align:right; font-weight:normal; color:#888;">(\${formatRupiah(pengeluaranBelanjaParts)})</td></tr>\` : ''}`;

code = code.replace(oldPdfExpense, newPdfExpense);

fs.writeFileSync('src/features/reports/Reports.tsx', code);
