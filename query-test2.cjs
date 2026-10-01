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
  const { data, error } = await supabase
        .from('transaction_items')
        .select(`
          id, item_name, item_type, quantity, unit_price, subtotal, is_service,
          transactions!inner(
            id, created_at, motor_type, mechanic_id, status,
            mechanics(id, name)
          )
        `)
        .limit(1);
  console.log("DATA:", data);
  console.log("ERROR:", error);
}
run();
