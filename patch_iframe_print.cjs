const fs = require('fs')

function patchPrint(filepath) {
  let content = fs.readFileSync(filepath, 'utf8')
  
  const oldPrint = /function printReceipt\(\) \{[\s\S]*?setTimeout\(\(\) => win\.print\(\), 400\)\s*\}/
  
  const newPrint = `function printReceipt() {
    const el = receiptRef.current
    if (!el) return
    
    // Create a hidden iframe
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
    doc.write(\`<html><head><title>Struk</title>
    <style>
      @page { margin: 0; }
      body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }
    </style>
    </head><body>
    \${el.innerHTML}
    </body></html>\`)
    doc.close()

    // Wait for images to load before printing
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 500)
    }
  }`

  content = content.replace(oldPrint, newPrint)
  
  // also handle Transactions.tsx which might have it written directly in onClick or a function
  if (filepath.includes('Transactions.tsx')) {
    const oldTrxPrint = /onClick=\{.*?win\.document\.write.*?setTimeout\(\(\) => win\.print\(\), 400\)\s*\}/
    
    // If it's inline in Transactions.tsx, we need to replace the whole button or extract it.
    // Let's check how it's written in Transactions.tsx
  }

  fs.writeFileSync(filepath, content)
}

patchPrint('src/features/cashier/Cashier.tsx')
console.log('Cashier print patched')
