const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// Calculate totalPemasukan
const labaStart = `  const untungParts = totalPartAll - totalModal
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;

const labaNew = `  const untungParts = totalPartAll - totalModal
  const totalPemasukanKotor = totalJasaAll + totalPartAll + totalKasir
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;

code = code.replace(labaStart, labaNew);

// Update Summary Cards Grid
// Replace `gap-4` with `gap-3 md:gap-4` for tighter spacing, and add the card.
const oldGrid = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '🔨 Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🔩 Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '📦 Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '✅ Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🛒 Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '💸 Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '⚠️ Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: '🏆 Total Pendapatan Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700', bg: 'bg-blue-50', border: 'border-blue-300' },`;

const newGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: '🔨 Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🔩 Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '🛒 Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '💰 Total Pemasukan', value: formatRupiah(totalPemasukanKotor), color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
          { label: '📦 Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '✅ Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '💸 Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '⚠️ Piutang', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: '🏆 Pendapatan Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700', bg: 'bg-blue-50', border: 'border-blue-400' },
          { label: ' ', value: ' ', color: '', bg: 'bg-transparent', border: 'border-transparent' }, // empty spacer for neat 10-grid slot
        ].filter(c => c.label !== ' ').map((c, i) => (
          <div key={i} className={\`\${c.bg} border \${c.border} rounded-xl p-3\`}>
            <p className="text-xs text-gray-600 mb-1 font-medium">{c.label}</p>
            <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>`;

// Wait, the filter map replacement might fail if the old string doesn't match perfectly.
// Let's use a regex to replace the entire <div className="grid... block
