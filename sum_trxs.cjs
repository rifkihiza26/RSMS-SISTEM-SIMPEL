const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: trxs } = await supabase.from('transactions').select('transaction_number, total').order('created_at', { ascending: false });
  console.log(`Transactions:`);
  let sum = 0;
  for(let t of trxs) {
    console.log(`${t.transaction_number}: ${t.total}`);
    sum += t.total;
  }
  console.log(`TOTAL DB SUM: ${sum}`);
}
run();
