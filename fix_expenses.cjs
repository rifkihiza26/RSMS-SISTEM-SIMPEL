const fs = require('fs');
let code = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf-8');

// Ensure 'Belanja Sparepart' is in the categories array
const queryReplacement = `
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('expense_categories').select('name').order('name')
      return (data ?? []).map((c: any) => c.name)
    }
  })
  
  // Ensure "Belanja Sparepart" is always available
  const categories = dbCategories.includes('Belanja Sparepart') 
    ? dbCategories 
    : ['Belanja Sparepart', ...dbCategories];
`;

code = code.replace(/const \{ data: categories = \[\] \} = useQuery\(\{[\s\S]*?\}\)/, queryReplacement);

fs.writeFileSync('src/features/expenses/Expenses.tsx', code);
