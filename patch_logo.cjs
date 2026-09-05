const fs = require('fs');

// Patch AppLayout.tsx
let layoutCode = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');
layoutCode = layoutCode.replace(
  /<div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg flex-shrink-0">\s*<Wrench className="h-4 w-4 text-white" \/>\s*<\/div>/g,
  '<img src="/logo.png" alt="RSMS Logo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />'
);
fs.writeFileSync('src/layouts/AppLayout.tsx', layoutCode);

// Patch Login.tsx
let loginCode = fs.readFileSync('src/features/auth/Login.tsx', 'utf8');
loginCode = loginCode.replace(
  /<div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-xl mb-4">\s*<Wrench className="h-7 w-7 text-white" \/>\s*<\/div>/g,
  '<div className="flex justify-center mb-5"><img src="/logo.png" alt="Rakyat Sinting Matic Shop" className="h-24 w-24 rounded-2xl object-cover shadow-sm" /></div>'
);
fs.writeFileSync('src/features/auth/Login.tsx', loginCode);

