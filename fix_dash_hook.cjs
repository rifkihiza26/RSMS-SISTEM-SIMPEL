const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// Inside useDashboardData, return totalModalBarang, totalGaji
code = code.replace(/return \{ totalJasa, totalBarang, totalPengeluaranLain, profitKotor/g, 'return { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitKotor');

// In AdminDashboard, destructure totalModalBarang, totalGaji
code = code.replace(/const \{ totalJasa, totalBarang, totalPengeluaranLain/g, 'const { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain');

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
