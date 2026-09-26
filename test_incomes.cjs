const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const { data: incomes, error: err1 } = await supabase.from('incomes').select('*').gte('date', monthStart);
  const { data: trxs, error: err2 } = await supabase.from('transactions').select('*').gte('created_at', monthStart + 'T00:00:00+07:00').in('status', ['COMPLETED', 'PAID']);
  
  if (err1 || err2) return console.log(err1, err2);
  
  const incomeTotal = incomes.reduce((s, r) => s + r.amount, 0);
  const trxTotal = trxs.reduce((s, r) => s + r.total, 0);
  
  console.log(`Income Table Total (Month): ${incomeTotal}`);
  console.log(`Transactions Table Total (Month): ${trxTotal}`);
  
  const manualIncomes = incomes.filter(i => !i.transaction_id);
  const manualTotal = manualIncomes.reduce((s, r) => s + r.amount, 0);
  
  console.log(`Manual Incomes Total: ${manualTotal}`);
  console.log(`Difference: ${incomeTotal - trxTotal}`);
}
run();
