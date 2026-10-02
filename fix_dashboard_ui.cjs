const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// Update OwnerDashboard UI
code = code.replace(/<div className="grid grid-cols-1 md:grid-cols-3 gap-4">/g, '<div className="grid grid-cols-1 md:grid-cols-4 gap-4">');

// OwnerDashboard
const oldOwner = `      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />
      </div>`;
const newOwner = `      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="PEMASUKAN TOTAL" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalGaji + totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Gaji + Operasional" />
        <StatCard title="BELANJA PARTS (INFO)" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" big subtitle="Tidak potong laba lagi" />
        <StatCard title="LABA BERSIH" value={formatRupiah(profitBersih)} icon={Wallet} color={profitBersih >= 0 ? 'blue' : 'red'} big subtitle={periodLabel} />
      </div>`;
code = code.replace(oldOwner, newOwner);

// AdminDashboard
code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">/g, '<div className="grid grid-cols-1 sm:grid-cols-4 gap-4">');

const oldAdmin = `      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="TOTAL PEMASUKAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Operasional Bengkel" />
        <StatCard title="LABA KOTOR" value={formatRupiah(profitKotor)} icon={Wallet} color="purple" big subtitle="Sebelum Gaji & Ops" />
      </div>`;
const newAdmin = `      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="TOTAL PEMASUKAN" value={formatRupiah(totalJasa + totalBarang)} icon={TrendingUp} color="green" big subtitle="Jasa + Penjualan Parts" />
        <StatCard title="PENGELUARAN OPS" value={formatRupiah(totalPengeluaranLain)} icon={TrendingDown} color="orange" big subtitle="Diluar Gaji & Belanja" />
        <StatCard title="BELANJA STOK (INFO)" value={formatRupiah(totalBelanjaParts)} icon={TrendingDown} color="purple" big subtitle="Arus Kas Belanja" />
        <StatCard title="LABA KOTOR" value={formatRupiah(profitKotor)} icon={Wallet} color="blue" big subtitle="Sebelum Gaji & Ops" />
      </div>`;
code = code.replace(oldAdmin, newAdmin);

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
