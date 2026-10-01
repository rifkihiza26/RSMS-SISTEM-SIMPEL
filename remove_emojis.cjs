const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// Hapus emoji dari Grid UI
code = code.replace(/🔨 /g, '');
code = code.replace(/🔩 /g, '');
code = code.replace(/🛒 /g, '');
code = code.replace(/💰 /g, '');
code = code.replace(/📦 /g, '');
code = code.replace(/✅ /g, '');
code = code.replace(/💸 /g, '');
code = code.replace(/⚠️ /g, '');
code = code.replace(/🏆 /g, '');

fs.writeFileSync('src/features/reports/Reports.tsx', code);
