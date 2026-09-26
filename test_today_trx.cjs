const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: trxs } = await supabase.from('transactions').select('*');
  const d24 = trxs.filter(t => {
      const d = new Date(t.created_at);
      d.setHours(d.getHours() + 7);
      return d.toISOString().split('T')[0] === '2026-09-24' && ['COMPLETED', 'PAID'].includes(t.status);
  });
  console.log('Trx on Sept 24:', d24);
}
run();
