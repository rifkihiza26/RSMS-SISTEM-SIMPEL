const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldSummaryBox = `<div class="summary-box">
        <h2 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Ringkasan Keuangan (Laba Rugi)</h2>
        <div class="summary-grid">
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PEMASUKAN (INCOME)</div>
            <div class="sum-row"><span>Total Rekapan Servis:</span> <span class="text-green">\${formatRupiah(totalRekapan)}</span></div>
            <div class="sum-row"><span>Total Penjualan Kasir:</span> <span class="text-green">\${formatRupiah(totalKasir)}</span></div>
            <div class="sum-row total"><span>TOTAL KOTOR:</span> <span class="text-green">\${formatRupiah(totalRekapan + totalKasir)}</span></div>
            <br/>
            <div class="sum-row"><span>Harga Pokok / Modal Parts:</span> <span class="text-red">-\${formatRupiah(totalModal)}</span></div>
            <div class="sum-row total"><span>ESTIMASI LABA KOTOR:</span> <span class="text-blue">\${formatRupiah(labaKotor)}</span></div>
          </div>
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PENGELUARAN (OUTCOME)</div>
            <div class="sum-row"><span>Pengeluaran Operasional & Gaji:</span> <span class="text-red">\${formatRupiah(totalPengeluaran)}</span></div>
            <div class="sum-row total"><span>TOTAL PENGELUARAN:</span> <span class="text-red">\${formatRupiah(totalPengeluaran)}</span></div>
            <br/><br/><br/>
            <div class="sum-row total" style="font-size: 18px; border-top: 3px solid #111;">
              <span>LABA BERSIH:</span> 
              <span class="\${labaRekapan >= 0 ? 'text-green' : 'text-red'}">\${formatRupiah(labaRekapan)}</span>
            </div>
          </div>
        </div>
      </div>`;

const newSummaryBox = `<div class="summary-box">
        <h2 style="margin-top:0; margin-bottom:16px; font-size:16px;">Ringkasan Pendapatan</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom: 0;">
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
        </table>
      </div>`;

code = code.replace(oldSummaryBox, newSummaryBox);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
