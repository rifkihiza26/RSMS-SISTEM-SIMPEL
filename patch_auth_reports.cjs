const fs = require('fs')
let content = fs.readFileSync('src/features/reports/Reports.tsx', 'utf8')
// Ensure Reports page redirects to dashboard if not owner
if (!content.includes('if (!loading && !isOwner)')) {
  content = content.replace(
    /if \(\!user\) return null/,
    "if (!user) return null\n  if (!loading && !isOwner) { navigate({ to: '/dashboard' }); return null }"
  )
  content = content.replace(
    /const \{ user \} = useAuth\(\)/,
    "const { user, isOwner, loading } = useAuth()"
  )
  fs.writeFileSync('src/features/reports/Reports.tsx', content)
}
