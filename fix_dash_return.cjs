const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

code = code.replace(/return \{ totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih/g, 'return { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih');
code = code.replace(/const \{ totalJasa, totalBarang, totalGaji, totalPengeluaranLain/g, 'const { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain');

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
