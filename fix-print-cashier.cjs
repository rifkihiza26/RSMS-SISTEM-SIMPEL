const fs = require('fs');
const content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf-8');

const target = `    doc.open()
    doc.write(\`<html><head><title>Struk</title>
    <style>
      @page { size: 58mm auto; margin: 0; }
      body { font-family: monospace; font-size: 12px; margin: 0; padding: 4px; width: 58mm; color: black; background: white; }
    </style>
    </head><body>
    \${el.innerHTML}
    </body></html>\`)
    doc.close()`;

const replacement = `    const isBesar = notaType === 'BESAR';
    
    doc.open()
    if (isBesar) {
      // Setup print for A5
      doc.write(\`<html><head><title>Invoice</title>
      <style>
        @page { size: A5; margin: 0; }
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 20px; color: black; background: white; }
        * { box-sizing: border-box; }
      </style>
      </head><body>
      \${el.innerHTML}
      </body></html>\`)
    } else {
      // Setup print for 58mm thermal
      doc.write(\`<html><head><title>Struk</title>
      <style>
        @page { size: 58mm auto; margin: 0; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 11px; margin: 0; padding: 0 4px; width: 58mm; color: black; background: white; }
        * { box-sizing: border-box; }
      </style>
      </head><body>
      \${el.innerHTML}
      </body></html>\`)
    }
    doc.close()`;

const newContent = content.replace(target, replacement);
fs.writeFileSync('src/features/cashier/Cashier.tsx', newContent);
console.log(content.includes(target) ? 'Replaced' : 'Not found');
