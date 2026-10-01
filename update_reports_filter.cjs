const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const anchor = `  // Summary numbers
  const totalRekapan = rekapanTrx.reduce((s, t) => s + t.total, 0)`;

const newCode = `  if (mechanicFilter !== 'ALL') {
    rekapanWithDetail = rekapanWithDetail.filter(r => r.mekanik.toLowerCase() === mechanicFilter.toLowerCase())
  }

  // Summary numbers
  const totalRekapan = rekapanWithDetail.reduce((s, t) => s + t.total, 0)`;

code = code.replace(anchor, newCode);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
