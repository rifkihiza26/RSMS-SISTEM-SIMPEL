const fs = require('fs')

let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')

// We will replace the onClick body of the Print button
const oldPrintLogicRegex = /const win = window\.open\('', '_blank'\)[\s\S]*?setTimeout\(\(\) => \{ win\.print\(\) \}, 500\)/

const newPrintLogic = `
                  const iframe = document.createElement('iframe')
                  iframe.style.position = 'fixed'
                  iframe.style.right = '0'
                  iframe.style.bottom = '0'
                  iframe.style.width = '0'
                  iframe.style.height = '0'
                  iframe.style.border = 'none'
                  document.body.appendChild(iframe)

                  const doc = iframe.contentWindow?.document
                  if (!doc) return

                  doc.open()
                  doc.write(\`<html><head><title>Struk - \${detailTrx.transaction_number}</title>
                  <style>
                    @page { margin: 0; }
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }
                  </style>
                  </head><body>
                  \${el.innerHTML}
                  </body></html>\`)
                  doc.close()

                  iframe.onload = () => {
                    setTimeout(() => {
                      iframe.contentWindow?.focus()
                      iframe.contentWindow?.print()
                      setTimeout(() => document.body.removeChild(iframe), 1000)
                    }, 500)
                  }
`

content = content.replace(oldPrintLogicRegex, newPrintLogic)
// replace el.outerHTML with el.innerHTML if it was missed
// Actually I just used el.innerHTML in the string interpolation above.

fs.writeFileSync('src/features/transactions/Transactions.tsx', content)
console.log('Transactions print patched')
