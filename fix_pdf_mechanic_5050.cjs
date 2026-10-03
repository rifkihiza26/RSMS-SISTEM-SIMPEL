const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldPdf = `<tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:16px; font-weight:bold; color:#111;">TOTAL KONTRIBUSI (JASA + UNTUNG PARTS)</td>
              <td style="text-align:right; font-size:18px; font-weight:bold; border-top:2px solid #1f2937; color:#1d4ed8">\${formatRupiah(totalJasaAll + untungParts)}</td>
            </tr>`;
const newPdf = `<tr>
              <td style="padding:12px 0 8px; border-top:2px solid #1f2937; font-size:14px; font-weight:bold; color:#111;">HAK MEKANIK (50% JASA)</td>
              <td style="text-align:right; font-size:16px; font-weight:bold; border-top:2px solid #1f2937; color:#166534">\${formatRupiah(totalJasaAll * 0.5)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0 8px; font-size:14px; font-weight:bold; color:#111;">HAK BENGKEL (50% JASA + UNTUNG PARTS)</td>
              <td style="text-align:right; font-size:16px; font-weight:bold; color:#1d4ed8">\${formatRupiah((totalJasaAll * 0.5) + untungParts)}</td>
            </tr>`;

code = code.replace(oldPdf, newPdf);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
