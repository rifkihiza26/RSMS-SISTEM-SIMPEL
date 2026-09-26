const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const d = new Date();
  // Adjust to WIB (UTC+7)
  const wibTime = new Date(d.getTime() + (7 * 60 * 60 * 1000));
  const todayWib = wibTime.toISOString().split('T')[0];
  const monthStartWib = new Date(wibTime.getFullYear(), wibTime.getMonth(), 1).toISOString().split('T')[0];

  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  console.log(`UTC today: ${today}, month: ${monthStart}`);
  console.log(`WIB today: ${todayWib}, month: ${monthStartWib}`);

  const { data: incMonth } = await supabase.from('incomes').select('amount').gte('date', monthStart);
  const totalIncMonth = incMonth.reduce((s, r) => s + r.amount, 0);

  const { data: trxsMonth } = await supabase.from('transactions').select('total').gte('created_at', monthStart + 'T00:00:00+07:00').in('status', ['COMPLETED', 'PAID']);
  const totalTrxMonth = trxsMonth.reduce((s, r) => s + r.total, 0);

  console.log(`\nMonth Income (Dashboard logic): ${totalIncMonth}`);
  console.log(`Month Trx (Kasir logic): ${totalTrxMonth}`);
}
run();
