const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

code = code.replace(/Package, /g, '');
code = code.replace(/Calendar, /g, '');
code = code.replace('const { totalJasa, totalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel }', 'const { totalJasa, totalBarang, totalPengeluaranLain, profitKotor, downloadPDF, downloadExcel }');

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
