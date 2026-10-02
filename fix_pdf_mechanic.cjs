const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// Replace the PDF HTML structure
const oldSummary = `<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Pendapatan</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">\${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pendapatan Kasir</td><td style="text-align:right; font-weight:bold; color:#2563eb;">\${formatRupiah(totalKasir)}</td></tr>
            <tr><td style="padding:7px 0; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">TOTAL PEMASUKAN KOTOR</td><td style="text-align:right; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">\${formatRupiah(totalPemasukanKotor)}</td></tr>
            
            <tr><td style="padding:7px 0; color:#555;">Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(untungParts)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pengeluaran</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalPengeluaran)}</td></tr>
            \${totalPiutang > 0 ? \`<tr><td style="padding:7px 0; color:#555;">Piutang Belum Lunas</td><td style="text-align:right; font-weight:bold; color:#ea580c;">\${formatRupiah(totalPiutang)}</td></tr>\` : ''}
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">TOTAL PENDAPATAN BERSIH</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:\${labaRekapan >= 0 ? '#1d4ed8' : '#dc2626'}">\${formatRupiah(labaRekapan)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;

const newSummary = `\${mechanicFilter === 'ALL' ? \`<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Pendapatan</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">\${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pendapatan Kasir</td><td style="text-align:right; font-weight:bold; color:#2563eb;">\${formatRupiah(totalKasir)}</td></tr>
            <tr><td style="padding:7px 0; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">TOTAL PEMASUKAN KOTOR</td><td style="text-align:right; font-weight:bold; color:#111; border-top:1px solid #d1d5db; background:#f9fafb;">\${formatRupiah(totalPemasukanKotor)}</td></tr>
            
            <tr><td style="padding:7px 0; color:#555;">Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(untungParts)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Pengeluaran</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalPengeluaran)}</td></tr>
            \${totalPiutang > 0 ? \`<tr><td style="padding:7px 0; color:#555;">Piutang Belum Lunas</td><td style="text-align:right; font-weight:bold; color:#ea580c;">\${formatRupiah(totalPiutang)}</td></tr>\` : ''}
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">TOTAL PENDAPATAN BERSIH</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:\${labaRekapan >= 0 ? '#1d4ed8' : '#dc2626'}">\${formatRupiah(labaRekapan)}</td>
            </tr>
          </tbody>
        </table>
      </div>\` : \`<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Kinerja Mekanik: \${mechanicFilter}</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
          <tbody>
            <tr><td style="padding:7px 0; color:#555;">Total Jasa Servis</td><td style="text-align:right; font-weight:bold; color:#16a34a;">\${formatRupiah(totalJasaAll)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Penjualan Parts (Bruto)</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(totalPartAll)}</td></tr>
            <tr><td style="padding:7px 0; color:#555;">Modal / HPP Parts</td><td style="text-align:right; font-weight:bold; color:#dc2626;">-\${formatRupiah(totalModal)}</td></tr>
            <tr><td style="padding:7px 0; border-top:1px dashed #e5e7eb; color:#555;">Untung dari Parts</td><td style="text-align:right; font-weight:bold; color:#16a34a; border-top:1px dashed #e5e7eb;">\${formatRupiah(untungParts)}</td></tr>
            <tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">TOTAL KONTRIBUSI (JASA + UNTUNG PARTS)</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:#1d4ed8">\${formatRupiah(totalJasaAll + untungParts)}</td>
            </tr>
          </tbody>
        </table>
      </div>\`}`;

code = code.replace(oldSummary, newSummary);

// Hide Kasir and Expenses if mechanic is selected
code = code.replace(/\$\{kasirTrx.length > 0 \? \`/g, '${kasirTrx.length > 0 && mechanicFilter === \'ALL\' ? `');
code = code.replace(/\$\{expenses.length > 0 \? \`/g, '${expenses.length > 0 && mechanicFilter === \'ALL\' ? `');

// Title change for PDF
code = code.replace(/<h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP<\/h1>/, `<h1>\${mechanicFilter === 'ALL' ? 'HASIL REKAPAN & BUKU KAS' : 'LAPORAN KINERJA MEKANIK'} - RAKYAT SINTING MATIC SHOP</h1>`);

fs.writeFileSync('src/features/reports/Reports.tsx', code);
