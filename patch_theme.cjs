const fs = require('fs');

// 1. Update index.css Primary Color (to a vibrant Blue from the logo)
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(/--primary:\s*[\d\.\s%]+;/g, '--primary: 196 100% 47%;');
fs.writeFileSync('src/index.css', css);

// 2. Update AppLayout.tsx to use a Dark Sidebar
let layout = fs.readFileSync('src/layouts/AppLayout.tsx', 'utf8');

// Sidebar container
layout = layout.replace(/bg-white flex flex-col shadow-xl/g, 'bg-zinc-950 flex flex-col shadow-xl');
layout = layout.replace(/bg-white fixed inset-y-0 left-0/g, 'bg-zinc-950 fixed inset-y-0 left-0 border-zinc-800');
layout = layout.replace(/border-r bg-white/g, 'border-r border-zinc-800 bg-zinc-950');

// Brand text
layout = layout.replace(/text-gray-900 leading-tight truncate/g, 'text-zinc-100 leading-tight truncate');
layout = layout.replace(/text-gray-500 truncate/g, 'text-zinc-400 truncate');
layout = layout.replace(/border-b/g, 'border-zinc-800 border-b'); // brand bottom border

// Nav links
layout = layout.replace(/text-gray-600 hover:bg-gray-100 hover:text-gray-900/g, 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100');
layout = layout.replace(/bg-primary\/10 text-primary/g, 'bg-primary/20 text-primary font-semibold');

// User info area
layout = layout.replace(/border-t px-3 py-3/g, 'border-t border-zinc-800 px-3 py-3');
layout = layout.replace(/text-gray-900 truncate/g, 'text-zinc-100 truncate');
layout = layout.replace(/bg-gray-100 text-gray-600/g, 'bg-zinc-800 text-zinc-300');
layout = layout.replace(/text-gray-500 hover:text-red-600 hover:bg-red-50/g, 'text-zinc-400 hover:text-red-400 hover:bg-red-950/50');

fs.writeFileSync('src/layouts/AppLayout.tsx', layout);
