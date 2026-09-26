const fs = require('fs')
let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Fix useAuth import path
c = c.replace("from '../../hooks/useAuth'", "from '@/contexts/AuthContext'")

// 2. Change default export to named export
c = c.replace('export default function Cashier()', 'export function Cashier()')

// 3. Remove unused openBills state
c = c.replace(`  const [openBills, setOpenBills] = useState<OpenBill[]>([])

  // UI States`, `  // UI States`)

// 4. Remove unused idx parameter
c = c.replace(`{sessions.map((s, idx) => (`, `{sessions.map((s) => (`)}

fs.writeFileSync('src/features/cashier/Cashier.tsx', c)
console.log('Errors fixed!')
