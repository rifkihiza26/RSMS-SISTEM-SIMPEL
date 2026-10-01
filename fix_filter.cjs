const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// The line is actually `  const rekapanWithDetail = rekapanTrx.map(t => {`
// Let's replace `const rekapanWithDetail = ` with `let rekapanWithDetail = `

code = code.replace("  const rekapanWithDetail = rekapanTrx.map(t => {", "  let rekapanWithDetail = rekapanTrx.map(t => {");

// Then, find where `const groupedByMekanik` is, and insert the filter before it.
const groupedRegex = /const groupedByMekanik = rekapanWithDetail\.reduce\(\(acc, t\) => \{/g;
const groupedReplace = `
  if (mechanicFilter !== 'ALL') {
    rekapanWithDetail = rekapanWithDetail.filter(r => r.mekanik.toLowerCase() === mechanicFilter.toLowerCase())
  }

  const groupedByMekanik = rekapanWithDetail.reduce((acc, t) => {`;
code = code.replace(groupedRegex, groupedReplace);

fs.writeFileSync('src/features/reports/Reports.tsx', code);
