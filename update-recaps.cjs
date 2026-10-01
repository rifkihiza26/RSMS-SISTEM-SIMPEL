const fs = require('fs');
let content = fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8');

// 1. Calculate Total Untung
// After `const profitBarang = totalBarangJual - totalBarangModal`
if (!content.includes('const totalUntung =')) {
  content = content.replace(
    'const profitBarang = totalBarangJual - totalBarangModal',
    'const profitBarang = totalBarangJual - totalBarangModal\n  const totalUntung = totalJasa + profitBarang'
  );
}

// 2. Update Grand Total UI
const oldTotalUI = `<div className="bg-gray-900 text-white p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Total Tagihan (Jasa + Jual Part)</p>
            <p className="text-3xl font-bold mt-1">{formatRupiah(totalAkhir)}</p>
          </div>`;
          
const newTotalUI = `<div className="bg-gray-900 text-white p-5 rounded-xl flex sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Tagihan (Jasa + Jual Part)</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">{formatRupiah(totalAkhir)}</p>
            <div className="flex gap-4 mt-3 text-sm">
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Modal:</span> <span className="text-red-400 font-semibold">{formatRupiah(totalBarangModal)}</span></div>
              <div className="bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700"><span className="text-gray-400">Total Untung:</span> <span className="text-green-400 font-semibold">{formatRupiah(totalUntung)}</span></div>
            </div>
          </div>`;

content = content.replace(oldTotalUI, newTotalUI);
fs.writeFileSync('src/features/recaps/Recaps.tsx', content);
