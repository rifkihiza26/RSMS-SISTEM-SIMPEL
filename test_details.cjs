const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: incomes, error: err1 } = await supabase.from('incomes').select('*');
  const { data: trxs, error: err2 } = await supabase.from('transactions').select('*');
  
  let trxSum = 0;
  for(let t of trxs) {
    if(t.status === 'COMPLETED' || t.status === 'PAID') trxSum += t.total;
  }
  
  let incSum = 0;
  for(let i of incomes) incSum += i.amount;
  
  console.log(`TOTAL INCOMES DB: ${incSum}`);
  console.log(`TOTAL TRX (COMPLETED/PAID) DB: ${trxSum}`);
  
  // Let's list the incomes to see if there are duplicates or weird things
  const incByDate = {};
  for(let i of incomes) {
    incByDate[i.date] = (incByDate[i.date] || 0) + i.amount;
  }
  console.log(`\nIncomes by Date:`);
  for(let [d, amt] of Object.entries(incByDate).sort()) {
    console.log(` - ${d}: ${amt}`);
  }
  
  const trxByDate = {};
  for(let t of trxs) {
    if(t.status === 'COMPLETED' || t.status === 'PAID') {
      const d = new Date(t.created_at);
      // adjust to WIB
      d.setHours(d.getHours() + 7);
      const ds = d.toISOString().split('T')[0];
      trxByDate[ds] = (trxByDate[ds] || 0) + t.total;
    }
  }
  console.log(`\nTrxs by Date (WIB adjusted):`);
  for(let [d, amt] of Object.entries(trxByDate).sort()) {
    console.log(` - ${d}: ${amt}`);
  }
}
run();
