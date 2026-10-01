const fs = require('fs');
let content = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf-8');

if (!content.includes('href: \'/payroll\'')) {
  // Add icon import (Banknote or something)
  content = content.replace('ClipboardList,', 'ClipboardList, Banknote,');
  
  // Insert Penggajian after Laporan
  content = content.replace(
    "{ name: 'Laporan',     href: '/reports',      icon: FileText,        roles: ['OWNER', 'ADMIN'] },",
    "{ name: 'Laporan',     href: '/reports',      icon: FileText,        roles: ['OWNER', 'ADMIN'] },\n  { name: 'Penggajian',  href: '/payroll',      icon: Banknote,        roles: ['OWNER', 'ADMIN'] },"
  );
  
  fs.writeFileSync('src/layouts/AppLayout.tsx', content);
}
