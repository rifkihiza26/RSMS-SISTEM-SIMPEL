const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: incomes, error } = await supabase.from('incomes').select('*');
  
  const trxCounts = {};
  const duplicates = [];
  
  for(const inc of incomes) {
    if(!inc.transaction_id) continue;
    if(!trxCounts[inc.transaction_id]) {
      trxCounts[inc.transaction_id] = [inc];
    } else {
      trxCounts[inc.transaction_id].push(inc);
      duplicates.push(inc.transaction_id);
    }
  }
  
  const dupSet = new Set(duplicates);
  console.log(`Found ${dupSet.size} transaction IDs with duplicate incomes!`);
  
  let extraAmount = 0;
  for(const tid of dupSet) {
    const incs = trxCounts[tid];
    console.log(`\nDuplicate Trx ID: ${tid}`);
    incs.forEach(i => console.log(` - Income ID: ${i.id}, Amount: ${i.amount}, Created: ${i.created_at}`));
    // All but the last one are "extra"
    for(let i=0; i<incs.length-1; i++) {
        extraAmount += incs[i].amount;
    }
  }
  
  console.log(`\nTotal Extra Duplicate Amount: ${extraAmount}`);
}
run();
