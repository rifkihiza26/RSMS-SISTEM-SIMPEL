const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const monthStart = '2026-09-01';

  const { data: incMonth } = await supabase.from('incomes').select('amount').gte('date', monthStart);
  const totalIncMonth = incMonth.reduce((s, r) => s + r.amount, 0);

  const { data: trxsMonth } = await supabase.from('transactions').select('total').gte('created_at', monthStart + 'T00:00:00+07:00').in('status', ['COMPLETED', 'PAID']);
  const totalTrxMonth = trxsMonth.reduce((s, r) => s + r.total, 0);

  console.log(`Month Income: ${totalIncMonth}`);
  console.log(`Month Trx: ${totalTrxMonth}`);
}
run();
