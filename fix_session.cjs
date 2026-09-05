const fs = require('fs')
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf8')
content = content.replace(/const \{ data: session \} = useQuery\(\{[\s\S]*?\}\)[\r\n]+/m, '')
fs.writeFileSync('src/features/dashboard/Dashboard.tsx', content)
