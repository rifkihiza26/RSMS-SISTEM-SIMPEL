const fs = require('fs');
let code = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

code = code.replace(
  /const \{ data: mechanics = \[\] \} = useQuery\(\{\n    queryKey: \['mechanics-active'\],\n    queryFn: async \(\) => \{\n      const \{ data \} = await supabase\.from\('mechanics'\)\.select\('id,name'\)\.eq\('status', 'ACTIVE'\)\.order\('name'\)\n      return \(data \?\? \[\]\) as Mechanic\[\]\n    \}\n  \}\)/,
  `const { data: mechanics = [] } = useQuery({
    queryKey: ['mechanics-active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mechanics').select('id,name').order('name')
      if (error) console.error("Mechanics Error:", error)
      return (data ?? []) as Mechanic[]
    }
  })`
);

fs.writeFileSync('src/features/cashier/Cashier.tsx', code);
