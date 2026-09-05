const fs = require('fs');
let layout = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');
layout = layout.replace(
  /<header className="sm:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-zinc-800 border-b px-4 h-14">/g,
  '<header className="sm:hidden sticky top-0 z-30 flex items-center gap-3 bg-zinc-950 text-zinc-100 border-zinc-800 border-b px-4 h-14">'
);
fs.writeFileSync('src/layouts/AppLayout.tsx', layout);
