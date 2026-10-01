const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Add mechanicFilter state and allMechanics fetching.
const repStart = `export function Reports() {
  const { startDate, endDate, periodLabel, FilterUI } = useReportFilter()
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)`;

const repNew = `export function Reports() {
  const { startDate, endDate, periodLabel, FilterUI } = useReportFilter()
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null)
  const [mechanicFilter, setMechanicFilter] = useState('ALL')

  const { data: mechanics = [] } = useQuery({
    queryKey: ['reports', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('name')
      return data?.map(m => m.name) ?? []
    }
  })`;

code = code.replace(repStart, repNew);

// 2. Filter rekapanWithDetail.
const calcStart = `  // 3. Gabungkan items ke rekapan
  const rekapanWithDetail = rekapanTrx.map(trx => {`;

const calcNew = `  // 3. Gabungkan items ke rekapan
  let rekapanWithDetail = rekapanTrx.map(trx => {`;

code = code.replace(calcStart, calcNew);

const applyFilterRegex = /const groupedByMekanik = rekapanWithDetail\.reduce/;
const applyFilterReplacement = `
  if (mechanicFilter !== 'ALL') {
    rekapanWithDetail = rekapanWithDetail.filter(r => r.mekanik.toLowerCase() === mechanicFilter.toLowerCase())
  }

  const groupedByMekanik = rekapanWithDetail.reduce`;

code = code.replace(applyFilterRegex, applyFilterReplacement);

// 3. Calculate filtered totals
const totalsStart = `  // --- CALCULATE SUMMARY ---
  const totalRekapan = rekapanWithDetail.reduce((sum, t) => sum + t.total, 0)
  const totalKasir = kasirTrx.reduce((sum, t) => sum + t.total, 0)`;

// wait, this doesn't need to change, because rekapanWithDetail is already filtered!
// Wait! If mechanicFilter is applied to rekapanWithDetail, then totalRekapan, totalModal, dll will only be for that mechanic! 
// Perfect! This answers the user's "brapa sih nih menghasilkan untuk bengkel" for that mechanic!

// 4. Add the dropdown to UI.
const uiStart = `  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan dari kasir, rekapan servis, dan pengeluaran</p>
      </div>

      {/* FILTER DATE */}
      {FilterUI}`;

const uiNew = `  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan dari kasir, rekapan servis, dan pengeluaran</p>
      </div>

      {/* FILTER DATE & MECHANIC */}
      <div className="flex flex-wrap gap-4 items-start">
        <div className="flex-1">{FilterUI}</div>
        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
           <span className="text-sm font-semibold text-gray-700">Mekanik:</span>
           <select 
             className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 min-w-[150px]"
             value={mechanicFilter}
             onChange={e => setMechanicFilter(e.target.value)}
           >
             <option value="ALL">Semua Mekanik</option>
             {mechanics.map(name => <option key={name} value={name}>{name}</option>)}
           </select>
        </div>
      </div>`;

code = code.replace(uiStart, uiNew);

// 5. Update the PDF section title to include mechanic name if filtered
const pdfStart = `<h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: \\\${periodLabel}</div>`;

const pdfNew = `<h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: \\\${periodLabel} \\\${mechanicFilter !== 'ALL' ? ' | Mekanik: ' + mechanicFilter : ''}</div>`;

code = code.replace(pdfStart, pdfNew);

fs.writeFileSync('src/features/reports/Reports.tsx', code);
