const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

const oldLogic = `  const totalGaji = monthExpenses.filter(e => e.category === 'Penggajian' || e.category === 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  const totalPengeluaranLain = monthExpenses.filter(e => e.category !== 'Penggajian' && e.category !== 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)

  const profitKotor = totalJasa + (totalBarang - totalModalBarang)
  const profitBersih = profitKotor - (totalGaji + totalPengeluaranLain)`;

const newLogic = `  const totalGaji = monthExpenses.filter(e => e.category === 'Penggajian' || e.category === 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  
  // Pisahkan pengeluaran khusus belanja sparepart agar tidak motong laba (karena sudah dipotong HPP)
  const isBelanja = (cat) => cat && cat.toLowerCase().includes('belanja') && (cat.toLowerCase().includes('part') || cat.toLowerCase().includes('stok'));
  const totalBelanjaParts = monthExpenses.filter(e => isBelanja(e.category)).reduce((s, e) => s + (e.amount || 0), 0)
  
  // Pengeluaran operasional murni (diluar gaji dan belanja sparepart)
  const totalPengeluaranLain = monthExpenses.filter(e => e.category !== 'Penggajian' && e.category !== 'PENGGAJIAN' && !isBelanja(e.category)).reduce((s, e) => s + (e.amount || 0), 0)

  const profitKotor = totalJasa + (totalBarang - totalModalBarang)
  // Laba Bersih HANYA dikurangi operasional dan gaji, BUKAN belanja sparepart (karena sudah dari totalModalBarang)
  const profitBersih = profitKotor - (totalGaji + totalPengeluaranLain)`;

code = code.replace(oldLogic, newLogic);

// Add totalBelanjaParts to returns
code = code.replace(/return \{ totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, profitKotor, profitBersih, downloadPDF, downloadExcel \}/g, 'return { totalJasa, totalBarang, totalModalBarang, totalGaji, totalPengeluaranLain, totalBelanjaParts, profitKotor, profitBersih, downloadPDF, downloadExcel }');

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
