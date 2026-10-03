const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// Admin Dashboard Fix
const oldAdmin = `<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="TOTAL PEMASUKAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Diluar Gaji & Belanja" />
        <StatCard title="BELANJA STOK (INFO)" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" big subtitle="Arus Kas Belanja" />
        <StatCard title="LABA KOTOR" value={formatRupiah(profitKotor)} icon={Wallet} color="blue" big subtitle="Sebelum Gaji & Ops" />
      </div>`;
const newAdmin = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="TOTAL PEMASUKAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" subtitle="Diluar Gaji & Belanja" />
        <StatCard title="BELANJA STOK" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" subtitle="Arus Kas Belanja" />
        <StatCard title="LABA KOTOR" value={formatRupiah(profitKotor)} icon={Wallet} color="blue" subtitle="Sebelum Gaji & Ops" />
      </div>`;
code = code.replace(oldAdmin, newAdmin);

// Owner Dashboard Fix
const oldOwner = `<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="BELANJA PARTS (INFO)" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" big subtitle="Tidak potong laba lagi" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />
      </div>`;
const newOwner = `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" subtitle="Gaji + Operasional" />
        <StatCard title="BELANJA PARTS" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" subtitle="Hanya rekaman (info)" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} subtitle={periodLabel} />
      </div>`;
code = code.replace(oldOwner, newOwner);

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
