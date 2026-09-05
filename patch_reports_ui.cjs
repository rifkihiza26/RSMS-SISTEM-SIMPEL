const fs = require('fs');
let content = fs.readFileSync('src/features/reports/Reports.tsx', 'utf8');

// Replace the array mapping
content = content.replace(
  /\(\['today', 'this_week', 'this_month', 'custom'\] as PeriodOption\[\]\)/g,
  "(['today', 'this_week', 'this_month', 'this_year', 'custom'] as PeriodOption[])"
);

// Replace the label logic
content = content.replace(
  /\{p === 'today' \? 'Hari Ini' : p === 'this_week' \? 'Minggu Ini' : p === 'this_month' \? 'Bulan Ini' : 'Kustom'\}/g,
  "{p === 'today' ? 'Hari Ini' : p === 'this_week' ? 'Minggu Ini' : p === 'this_month' ? 'Bulan Ini' : p === 'this_year' ? 'Tahun Ini' : 'Kustom'}"
);

fs.writeFileSync('src/features/reports/Reports.tsx', content);
