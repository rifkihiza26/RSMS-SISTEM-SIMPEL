const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

content = content.replace("FileText, Sheet, ClipboardList }", "FileText, Sheet }");
content = content.replace("const { bulanLabel, totalJasa,", "const { totalJasa,");

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', content);
