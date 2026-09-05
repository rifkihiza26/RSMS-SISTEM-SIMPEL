const fs = require('fs')
let content = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8')

// Import isOwner
content = content.replace(
  "const { isAdmin, user } = useAuth()",
  "const { isAdmin, isOwner, user } = useAuth()"
)

// Add startDate and endDate states
content = content.replace(
  "const [dateFilter, setDateFilter] = useState('')",
  "const [dateFilter, setDateFilter] = useState('')\n  const [startDate, setStartDate] = useState('')\n  const [endDate, setEndDate] = useState('')"
)

// Update queryKey to include startDate and endDate
content = content.replace(
  "queryKey: ['expenses', dateFilter],",
  "queryKey: ['expenses', dateFilter, startDate, endDate],"
)

// Update queryFn
const queryLogic = `
      let q = supabase.from('expenses').select('*, profiles(full_name), mechanics(name)').order('created_at', { ascending: false })
      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        q = q.gte('date', today)
      } else if (dateFilter === 'month') {
        const monthStart = new Date().toISOString().slice(0, 7) + '-01'
        q = q.gte('date', monthStart)
      } else if (dateFilter === 'year') {
        const yearStart = new Date().getFullYear() + '-01-01'
        q = q.gte('date', yearStart)
      } else if (dateFilter === 'custom' && startDate && endDate) {
        q = q.gte('date', startDate).lte('date', endDate)
      }
      const { data, error } = await q
`

content = content.replace(
  /let q = supabase\.from\('expenses'\)[\s\S]*?const \{ data, error \} = await q/,
  queryLogic.trim()
)

// Update UI
const filterUI = `
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400" />
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-sm outline-none bg-transparent">
            <option value="">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="custom">Kustom</option>
          </select>
        </div>
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm outline-none bg-transparent" />
            <span className="text-gray-400">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm outline-none bg-transparent" />
          </div>
        )}
`

content = content.replace(
  /<div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 shadow-sm">\s*<Calendar className="h-4 w-4 text-gray-400" \/>\s*<select value=\{dateFilter\}[\s\S]*?<\/div>/,
  filterUI.trim()
)

// Allow Owner to add expense
content = content.replace(/\{isAdmin && \(/g, "{(isAdmin || isOwner) && (")

fs.writeFileSync('src/features/expenses/Expenses.tsx', content)
