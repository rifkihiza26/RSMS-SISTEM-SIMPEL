const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// The dashboard cards are:
// <StatCard title="TOTAL PENDAPATAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Barang" />
// <StatCard title="TOTAL PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
// <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />

const gridStart = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">`;
const gridEnd = `      </div>`;

const gridRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>/;

const newGrid = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Parts Kasir" />
        <StatCard title="UNTUNG PARTS" value={formatRupiah(totalBarang - totalModalBarang)} icon={TrendingUp} color="blue" big subtitle="Dari HPP Parts" />
        <StatCard title="PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />
      </div>`;

code = code.replace(gridRegex, newGrid);

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
