const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Ambil semua incomes
  const { data: incomes } = await supabase.from('incomes').select('*');
  // Ambil semua transaksi
  const { data: trxs } = await supabase.from('transactions').select('id');
  
  const trxSet = new Set(trxs.map(t => t.id));
  
  let orphans = [];
  for(let inc of incomes) {
    if(inc.transaction_id && !trxSet.has(inc.transaction_id)) {
      orphans.push(inc);
    }
  }
  
  console.log(`Strict Orphans: ${orphans.length}`);
  let total = 0;
  for(let o of orphans) {
    console.log(`Orphan: ID ${o.id} | TrxID ${o.transaction_id} | Amount ${o.amount}`);
    total += o.amount;
  }
  console.log(`Total Orphan Amount: ${total}`);
}
run();
