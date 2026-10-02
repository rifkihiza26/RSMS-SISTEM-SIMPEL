const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// fix type
code = code.replace(/const isBelanja = \(cat\) =>/g, "const isBelanja = (cat: string) =>");

// fix OwnerDashboard extraction
code = code.replace(/const \{ totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitBersih, downloadPDF, downloadExcel \} = useDashboardData/g, "const { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, totalBelanjaParts, profitBersih, downloadPDF, downloadExcel } = useDashboardData");

// fix AdminDashboard extraction
code = code.replace(/const \{ totalJasa, totalBarang, totalModalBarang, totalPengeluaranLain, profitKotor, downloadPDF, downloadExcel \} = useDashboardData/g, "const { totalJasa, totalBarang, totalModalBarang, totalPengeluaranLain, totalBelanjaParts, profitKotor, downloadPDF, downloadExcel } = useDashboardData");

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
