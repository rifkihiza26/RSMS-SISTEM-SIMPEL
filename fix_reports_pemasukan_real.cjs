const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// Calculate totalPemasukan
const labaStart = `  const untungParts = totalPartAll - totalModal
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;
const labaNew = `  const untungParts = totalPartAll - totalModal
  const totalPemasukanKotor = totalJasaAll + totalPartAll + totalKasir
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;
code = code.replace(labaStart, labaNew);

// Replace grid
const gridStart = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">`;
const gridEnd = `      </div>`;

const gridRegex = /<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">[\s\S]*?\}\)\]\n\s*\}\}\)\}\n\s*<\/div>/;

const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: '🔨 Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🔩 Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '🛒 Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '💰 Total Pemasukan Kotor', value: formatRupiah(totalPemasukanKotor), color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
          { label: '📦 Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '✅ Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '💸 Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '⚠️ Piutang', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: '🏆 Pendapatan Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700', bg: 'bg-blue-50', border: 'border-blue-400' }
        ].map((c, i) => (
          <div key={i} className={\`\${c.bg} border \${c.border} rounded-xl p-3 shadow-sm\`}>
            <p className="text-xs text-gray-600 mb-1 font-medium">{c.label}</p>
            <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>`;

code = code.replace(gridRegex, newGrid);

// Update PDF Summary
const oldTable = `<table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">🔨 Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">\${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">🔩 Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">📦 Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">✅ Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(untungParts)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">🛒 Pendapatan Kasir</td><td style="text-align:right; font-weight:bold; color:#2563eb;">\${formatRupiah(totalKasir)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">💸 Pengeluaran</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalPengeluaran)}</td></tr>
            \${totalPiutang > 0 ? \`<tr><td style="padding:7px 0; color:#555;">⚠️ Piutang Belum Lunas</td><td style="text-align:right; font-weight:bold; color:#ea580c;">\${formatRupiah(totalPiutang)}</td></tr>\` : ''}
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">🏆 TOTAL PENDAPATAN BERSIH</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:\${labaRekapan >= 0 ? '#1d4ed8' : '#dc2626'}">\${formatRupiah(labaRekapan)}</td>
            </tr>
          </tbody>
        </table>`;

const newTable = `<table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">🔨 Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">\${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">🔩 Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">🛒 Pendapatan Kasir</td><td style="text-align:right; font-weight:bold; color:#2563eb;">\${formatRupiah(totalKasir)}</td></tr>
            <tr><td style="padding:7px 0; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">💰 TOTAL PEMASUKAN KOTOR</td><td style="text-align:right; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">\${formatRupiah(totalPemasukanKotor)}</td></tr>
            
            <tr><td style="padding:7px 0; color:#555;">📦 Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">✅ Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(untungParts)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">💸 Pengeluaran</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalPengeluaran)}</td></tr>
            \${totalPiutang > 0 ? \`<tr><td style="padding:7px 0; color:#555;">⚠️ Piutang Belum Lunas</td><td style="text-align:right; font-weight:bold; color:#ea580c;">\${formatRupiah(totalPiutang)}</td></tr>\` : ''}
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">🏆 TOTAL PENDAPATAN BERSIH</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:\${labaRekapan >= 0 ? '#1d4ed8' : '#dc2626'}">\${formatRupiah(labaRekapan)}</td>
            </tr>
          </tbody>
        </table>`;

code = code.replace(oldTable, newTable);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
