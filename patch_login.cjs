const fs = require('fs');

let code = fs.readFileSync('src/features/auth/Login.tsx', 'utf8');

// Background and Text
code = code.replace(/bg-slate-50/g, 'bg-zinc-950');
code = code.replace(/text-gray-900/g, 'text-zinc-100');
code = code.replace(/text-gray-500/g, 'text-zinc-400');
code = code.replace(/text-gray-700/g, 'text-zinc-300');

// Card
code = code.replace(/bg-white border rounded-xl/g, 'bg-zinc-900 border border-zinc-800 rounded-xl');

// Inputs
code = code.replace(/border-gray-300 rounded-lg px-3 py-2\.5/g, 'border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-600 rounded-lg px-3 py-2.5');

// Fix text-gray-900 in heading if any
code = code.replace(/text-zinc-100 mb-6/g, 'text-zinc-100 mb-6'); // no change needed if replace matched

fs.writeFileSync('src/features/auth/Login.tsx', code);
