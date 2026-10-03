const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Ubah definisi t.totalUntung
code = code.replace(
  /const totalUntung = t.total - totalModal/g,
  'const totalUntung = totalPart - totalModal'
);

// 2. Tambah totalJasa dan totalUntungParts ke useMemo byMechanic
const oldByMechanic = `  // Group rekapan by mechanic
  const byMechanic = useMemo(() => {
    const map: Record<string, { name: string; trx: typeof rekapanWithDetail; total: number }> = {}
    for (const t of rekapanWithDetail) {
      const key = t.mekanik
      if (!map[key]) map[key] = { name: key, trx: [], total: 0 }
      map[key].trx.push(t)
      map[key].total += t.total
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [rekapanWithDetail])`;

const newByMechanic = `  // Group rekapan by mechanic
  const byMechanic = useMemo(() => {
    const map: Record<string, { name: string; trx: typeof rekapanWithDetail; total: number; totalJasa: number; totalUntungParts: number }> = {}
    for (const t of rekapanWithDetail) {
      const key = t.mekanik
      if (!map[key]) map[key] = { name: key, trx: [], total: 0, totalJasa: 0, totalUntungParts: 0 }
      map[key].trx.push(t)
      map[key].total += t.total
      map[key].totalJasa += t.totalJasa
      map[key].totalUntungParts += t.totalUntung
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [rekapanWithDetail])`;

code = code.replace(oldByMechanic, newByMechanic);

fs.writeFileSync('src/features/reports/Reports.tsx', code);
