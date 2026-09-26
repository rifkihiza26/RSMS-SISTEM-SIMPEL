const fs = require('fs')
let content = fs.readFileSync('src/lib/pdf.ts', 'utf8')

content = content.replace(
  `  const url = phone
    ? \`https://wa.me/\${phone.replace(/\\D/g, '')}?text=\${encodeURIComponent(msg)}\`
    : \`https://wa.me/?text=\${encodeURIComponent(msg)}\``,
  `  let formattedPhone = phone ? phone.replace(/\\D/g, '') : ''
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1)
  }
  const url = formattedPhone
    ? \`https://wa.me/\${formattedPhone}?text=\${encodeURIComponent(msg)}\`
    : \`https://wa.me/?text=\${encodeURIComponent(msg)}\``
)

fs.writeFileSync('src/lib/pdf.ts', content)
