const fs = require('fs')
let content = fs.readFileSync('src/features/reports/Reports.tsx', 'utf8')

// Add this_year to PeriodOption
content = content.replace(
  "type PeriodOption = 'today' | 'this_week' | 'this_month' | 'custom'",
  "type PeriodOption = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'"
)

// Add option to select
content = content.replace(
  /<option value="this_month">Bulan Ini<\/option>/,
  '<option value="this_month">Bulan Ini</option>\n            <option value="this_year">Tahun Ini</option>'
)

// Update logic in queryFn
const queryLogic = `
        if (period === 'today') {
          const today = new Date().toISOString().split('T')[0]
          iq = iq.gte('date', today)
          eq = eq.gte('date', today)
        } else if (period === 'this_week') {
          const d = new Date()
          d.setDate(d.getDate() - d.getDay() + 1)
          const weekStart = d.toISOString().split('T')[0]
          iq = iq.gte('date', weekStart)
          eq = eq.gte('date', weekStart)
        } else if (period === 'this_month') {
          const monthStart = new Date().toISOString().slice(0, 7) + '-01'
          iq = iq.gte('date', monthStart)
          eq = eq.gte('date', monthStart)
        } else if (period === 'this_year') {
          const yearStart = new Date().getFullYear() + '-01-01'
          iq = iq.gte('date', yearStart)
          eq = eq.gte('date', yearStart)
        } else if (period === 'custom' && startDate && endDate) {
`

content = content.replace(
  /if \(period === 'today'\) \{[\s\S]*?\} else if \(period === 'custom' && startDate && endDate\) \{/,
  queryLogic.trim() + ' {'
)

fs.writeFileSync('src/features/reports/Reports.tsx', content)
