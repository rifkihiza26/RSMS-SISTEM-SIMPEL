const fs = require('fs');

let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

const buttonsHtml = \`
            {/* Open Bill Action Buttons */}
            <div className="px-4 pt-2 pb-1 grid grid-cols-2 gap-2">
              <button onClick={saveOpenBill} disabled={processing || cart.length === 0}
                className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-bold text-xs flex items-center justify-center transition-colors disabled:opacity-50">
                 Simpan (Draft)
              </button>
              <button onClick={cancelOpenBill} disabled={processing}
                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-xs flex items-center justify-center transition-colors">
                 Batalkan
              </button>
            </div>
            
            <div className="px-4 py-3 border-t space-y-2">\`;

c = c.replace(/<div className="px-4 py-3 border-t space-y-2">/, buttonsHtml);

fs.writeFileSync('src/features/cashier/Cashier.tsx', c);
