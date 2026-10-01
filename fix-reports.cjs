const fs = require('fs');
let content = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Remove mechanics from txItems query
content = content.replace(
  `mechanics(id, name)`,
  ``
);

// 2. Add mechanics query before txItems
const newQuery = `  const { data: allMechanics = [] } = useQuery({
    queryKey: ['report-mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  // Query transaction_items`;

content = content.replace('  // Query transaction_items', newQuery);

// 3. Fix mechanicMap mapping
const oldMap = `const mechName = trx.mechanics?.name ?? '(Tanpa Mekanik)'`;
const newMap = `const mechName = allMechanics.find(m => m.id === mechId)?.name ?? '(Tanpa Mekanik)'`;

content = content.replace(oldMap, newMap);

fs.writeFileSync('src/features/reports/Reports.tsx', content);
console.log('Fixed reports');
