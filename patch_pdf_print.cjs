const fs = require('fs')

// 1. Hapus label badge MANUAL dll di tampilan modal Transactions
let trx = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')

// Menghapus badge MANUAL / PRODUCT / SERVICE di UI Modal (bukan hidden receipt)
trx = trx.replace(
  /<span className=\{`text-\[10px\] font-bold px-1\.5 py-0\.5 rounded \$\{i\.item_type === 'PRODUCT' \? 'bg-primary\/10 text-primary' : i\.item_type === 'SERVICE' \? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'\}`\}>\{i\.item_type\}<\/span>/,
  ''
)

// 2. Tambahkan tombol "Print Kertas Kasir (Thermal)"
// Fitur ini sama dengan Cashier - buka popup window untuk diprint langsung tanpa download PDF
trx = trx.replace(
  `{/* Hidden Receipt Format for printing */}`,
  `<button onClick={() => {
                  const el = document.getElementById('reprint-receipt')
                  if (!el) return
                  const win = window.open('', '_blank')
                  if (!win) return
                  win.document.write(\`<html><head><title>Struk - \${detailTrx.transaction_number}</title>
                  <style>
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 16px; width: 320px; color: black; background: white; }
                    .center { text-align: center; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                    .bold { font-weight: bold; }
                    .small { font-size: 11px; }
                    .separator { border-top: 1px dashed #000; margin: 6px 0; border-bottom: none; }
                    .separator-solid { border-top: 1px solid #000; margin: 6px 0; border-bottom: none; }
                    .logo { width: 140px; height: auto; object-fit: contain; margin: 0 auto 6px; display: block; }
                    .row-item-name { margin-bottom: 2px; }
                  </style>
                  </head><body>\`)
                  win.document.write(el.outerHTML)
                  win.document.write('</body></html>')
                  win.document.close()
                  setTimeout(() => { win.print(); win.close() }, 500)
                }} className="flex-1 bg-primary text-white hover:bg-primary/90 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print Struk</button>
              </div>

              {/* Hidden Receipt Format for printing */}`
)

fs.writeFileSync('src/features/transactions/Transactions.tsx', trx)
console.log('Transactions patched')
