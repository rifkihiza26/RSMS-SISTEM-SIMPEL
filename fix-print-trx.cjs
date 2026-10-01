const fs = require('fs');
let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');

const target2 = `iframe.style.width = '58mm'`;
const replace2 = `const isBesar = (detailTrx.notes || '').includes('[BESAR]');\n                  iframe.style.width = isBesar ? '148mm' : '58mm'`;
content = content.replace(target2, replace2);

const target3 = `doc.write(\`<html><head><title>Struk</title>
                  <style>
                    @page { size: 58mm auto; margin: 0; }
                    body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }
                  </style>
                  </head><body>
                  \${el.innerHTML}
                  </body></html>\`)`;

const replace3 = `if (isBesar) {
                    doc.write(\`<html><head><title>Invoice</title>
                    <style>
                      @page { size: A5; margin: 0; }
                      body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; color: black; background: white; }
                      * { box-sizing: border-box; }
                    </style>
                    </head><body>\${el.innerHTML}</body></html>\`)
                  } else {
                    doc.write(\`<html><head><title>Struk</title>
                    <style>
                      @page { size: 58mm auto; margin: 0; }
                      body { font-family: 'Courier New', Courier, monospace; font-size: 11px; margin: 0; padding: 0 4px; width: 58mm; color: black; background: white; }
                      * { box-sizing: border-box; }
                    </style>
                    </head><body>\${el.innerHTML}</body></html>\`)
                  }`;

content = content.replace(target3, replace3);
fs.writeFileSync('src/features/transactions/Transactions.tsx', content);
console.log('Replaced trx print');
