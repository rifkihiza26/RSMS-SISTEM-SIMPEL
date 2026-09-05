const fs = require('fs')
let content = fs.readFileSync('src/features/income/Income.tsx', 'utf8')
content = content.replace("const { isAdmin, user } = useAuth()", "const { isAdmin, isOwner, user } = useAuth()")
content = content.replace(/\{\(isAdmin \|\| user\?.email === 'owner@rsms\.com'\) && \(/, "{(isAdmin || isOwner) && (")
// Also if it originally had {isAdmin && (
content = content.replace(/\{isAdmin && \(/g, "{(isAdmin || isOwner) && (")
fs.writeFileSync('src/features/income/Income.tsx', content)
