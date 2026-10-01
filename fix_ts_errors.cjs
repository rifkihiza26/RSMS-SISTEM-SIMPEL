const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Remove TrendingUp & Wallet
code = code.replace(/TrendingUp, TrendingDown, Wallet, /g, 'TrendingDown, ');

// 2. Remove totalUntung calculation since it's unused now (we use untungParts)
code = code.replace(/const totalUntung = rekapanWithDetail.reduce\(\(s, t\) => s \+ t.totalUntung, 0\)/g, '');

// 3. Remove labaKotor calculation (unused in new PDF UI)
code = code.replace(/const labaKotor = totalRekapan \+ totalKasir - totalModal;/g, '');

fs.writeFileSync('src/features/reports/Reports.tsx', code);
