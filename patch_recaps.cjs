const fs = require('fs');
let code = fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8');

if (!code.includes('CalendarPicker')) {
  code = code.replace(
    "import { formatRupiah, generateTransactionNumber } from '@/lib/utils'",
    "import { formatRupiah, generateTransactionNumber } from '@/lib/utils'\nimport { MonthPicker, DayPicker } from '@/components/CalendarPicker'\nimport { Filter } from 'lucide-react'"
  );
}

const filterHook = `
type FilterMode = 'MONTH' | 'DAY' | 'RANGE'
function useRecapsFilter() {
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)
  const [mode, setMode] = useState<FilterMode>('MONTH')
  const [day, setDay] = useState(today)
  const [month, setMonth] = useState(currentMonth)
  const [rangeStart, setRangeStart] = useState(today)
  const [rangeEnd, setRangeEnd] = useState(today)
  const [mechanicFilter, setMechanicFilter] = useState('ALL')

  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (mode === 'MONTH') {
      const [y, m] = month.split('-')
      const start = \`\${month}-01\`
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
      const end = \`\${month}-\${String(lastDay).padStart(2, '0')}\`
      return { startDate: start, endDate: end, periodLabel: \`Bulan ini\` }
    }
    if (mode === 'DAY') return { startDate: day, endDate: day, periodLabel: 'Hari ini' }
    return { startDate: rangeStart, endDate: rangeEnd, periodLabel: 'Rentang' }
  }, [mode, day, month, rangeStart, rangeEnd])

  const FilterUI = (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-gray-700 font-semibold">
        <Filter className="w-4 h-4" /> Filter:
      </div>
      <div className="flex bg-gray-100 p-1 rounded-lg">
        {(['MONTH', 'DAY', 'RANGE'] as FilterMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={\`px-4 py-1.5 rounded-md text-sm font-medium transition-all \${mode === m ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}\`}
          >
            {m === 'MONTH' ? '📅 Bulan' : m === 'DAY' ? '📆 Hari' : '📊 Rentang'}
          </button>
        ))}
      </div>
      {mode === 'MONTH' && <MonthPicker value={month} onChange={setMonth} />}
      {mode === 'DAY' && <DayPicker value={day} onChange={setDay} />}
      {mode === 'RANGE' && (
        <div className="flex items-center gap-2 flex-wrap">
          <DayPicker value={rangeStart} onChange={setRangeStart} label="Dari" />
          <span className="text-gray-400 font-medium">→</span>
          <DayPicker value={rangeEnd} onChange={setRangeEnd} label="Sampai" />
        </div>
      )}
    </div>
  )
  return { startDate, endDate, mechanicFilter, setMechanicFilter, FilterUI }
}
`;

if (!code.includes('useRecapsFilter')) {
  code = code.replace('// ----------------------------------------------------', filterHook + '\n// ----------------------------------------------------');
}

// Modify OwnerRecapsList
const oldOwnerRecapsList = `function OwnerRecapsList() {
  const { data: allMechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['recaps', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanic_id, customer_name, payment_status, amount_paid, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) console.error(error)
      return data ?? []
    }
  })`;

const newOwnerRecapsList = `function OwnerRecapsList() {
  const { startDate, endDate, mechanicFilter, setMechanicFilter, FilterUI } = useRecapsFilter()

  const { data: allMechanics = [] } = useQuery({
    queryKey: ['recaps', 'mechanics'],
    queryFn: async () => {
      const { data } = await supabase.from('mechanics').select('id, name')
      return data ?? []
    }
  })

  const { data: recaps = [], isLoading } = useQuery({
    queryKey: ['recaps', 'list', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanic_id, customer_name, payment_status, amount_paid, transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: false })
      
      if (error) console.error(error)
      return data ?? []
    }
  })`;

code = code.replace(oldOwnerRecapsList, newOwnerRecapsList);

// Add Mechanic dropdown filter
const oldOwnerReturn = `  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hasil Rekapan Servis</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan dari kasir dan mekanik (Terbaru)</p>
      </div>`;

const newOwnerReturn = `  const filteredRecaps = mechanicFilter === 'ALL' ? recapsWithCalc : recapsWithCalc.filter((r: any) => r.mechanic_id === mechanicFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hasil Rekapan Servis</h1>
        <p className="text-sm text-gray-500 mt-1">Laporan dari kasir dan mekanik</p>
      </div>
      
      {FilterUI}
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">Filter Mekanik:</span>
        <select 
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          value={mechanicFilter} 
          onChange={e => setMechanicFilter(e.target.value)}
        >
          <option value="ALL">Semua Mekanik</option>
          {allMechanics.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
`;

code = code.replace(oldOwnerReturn, newOwnerReturn);

// Change `recapsWithCalc.map` to `filteredRecaps.map` inside OwnerRecapsList
code = code.replace(`{recapsWithCalc.map((trx: any) => {`, `{filteredRecaps.map((trx: any) => {`);

fs.writeFileSync('src/features/recaps/Recaps.tsx', code);
