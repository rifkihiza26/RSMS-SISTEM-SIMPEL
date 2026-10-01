const fs = require('fs');

let code = fs.readFileSync('src/features/recaps/Recaps.tsx', 'utf-8');

// Need to inject useReportFilter logic into Recaps.tsx, or better yet, extract it!
// But since I want to be fast, I can just copy the CalendarPicker usage.

const filterLogic = `
import { MonthPicker, DayPicker } from '@/components/CalendarPicker'
import { Filter } from 'lucide-react'

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
      const label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      return { startDate: start, endDate: end, periodLabel: \`Bulan \${label}\` }
    }
    if (mode === 'DAY') {
      const label = new Date(day + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      return { startDate: day, endDate: day, periodLabel: label }
    }
    const labelS = new Date(rangeStart + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    const labelE = new Date(rangeEnd + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return { startDate: rangeStart, endDate: rangeEnd, periodLabel: \`\${labelS} – \${labelE}\` }
  }, [mode, day, month, rangeStart, rangeEnd])

  return { startDate, endDate, periodLabel, mode, setMode, month, setMonth, day, setDay, rangeStart, setRangeStart, rangeEnd, setRangeEnd, mechanicFilter, setMechanicFilter }
}
`;

// Wait, doing this via sed/replace might be messy. Let's just rewrite the necessary parts using node scripts.
// But first, let's look at the structure of Recaps.tsx
