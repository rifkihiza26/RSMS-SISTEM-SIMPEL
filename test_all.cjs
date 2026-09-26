const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: incomes } = await supabase.from('incomes').select('id, amount, date');
  const { data: trxs } = await supabase.from('transactions').select('id, total, created_at, status');
  
  const incTotal = incomes.reduce((s, r) => s + r.amount, 0);
  const trxTotal = trxs.filter(t => ['COMPLETED', 'PAID'].includes(t.status)).reduce((s, r) => s + r.total, 0);
  
  console.log(`ALL Incomes Total: ${incTotal}`);
  console.log(`ALL COMPLETED/PAID Trx Total: ${trxTotal}`);
  
  const allTrxTotal = trxs.reduce((s, r) => s + r.total, 0);
  console.log(`ALL Trx (including OPEN/CANCELLED) Total: ${allTrxTotal}`);
}
run();
