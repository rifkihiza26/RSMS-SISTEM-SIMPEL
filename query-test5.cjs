const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);
async function run() {
  const from = '2026-09-01T00:00:00';
  const to = '2026-09-30T23:59:59';
  
  const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          id, item_name, item_type, quantity, unit_price, subtotal, is_service,
          transactions!inner(
            id, created_at, motor_type, mechanic_id, status
          )
        `)
        .gte('transactions.created_at', from)
        .lte('transactions.created_at', to)
        .in('transactions.status', ['COMPLETED', 'PAID'])
        .limit(5);
  
  console.log("DATA LENGTH:", data ? data.length : "null");
  if (error) {
    console.error("ERROR:", error);
  } else if (data && data.length > 0) {
    console.log("SAMPLE:", data[0]);
  }
}
run();
