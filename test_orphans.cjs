const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: incomes, error: err1 } = await supabase.from('incomes').select('*');
  const { data: transactions, error: err2 } = await supabase.from('transactions').select('id');
  
  if (err1 || err2) return console.log(err1, err2);
  
  const validTrxIds = new Set(transactions.map(t => t.id));
  
  const orphans = incomes.filter(inc => inc.transaction_id && !validTrxIds.has(inc.transaction_id));
  
  console.log(`Found ${orphans.length} orphaned incomes!`);
  
  let totalOrphanAmount = 0;
  for(const o of orphans) {
    console.log(`Orphan: Income ID ${o.id}, Amount ${o.amount}, Date ${o.date}`);
    totalOrphanAmount += o.amount;
  }
  console.log(`Total Orphaned Amount: ${totalOrphanAmount}`);
}
run();
