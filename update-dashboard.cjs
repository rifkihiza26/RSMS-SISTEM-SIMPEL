const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// Replace the query function for recentRecaps
const oldQuery = `const { data = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanics(name)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false }).limit(5)
      return data ?? []`;

const newQuery = `const { data } = await supabase.from('transactions')
        .select('transaction_number, total, notes, created_at, mechanics(name), transaction_items(subtotal, quantity, modal_price)')
        .like('notes', '%REKAPAN%')
        .order('created_at', { ascending: false }).limit(5)
      
      return data?.map(tx => {
        const items = tx.transaction_items || []
        const modal = items.reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)
        const untung = tx.total - modal
        return { ...tx, modal, untung }
      }) ?? []`;

content = content.replace(oldQuery, newQuery);

// Replace table header
const oldTh = `<th className="text-left px-4 py-3 font-medium text-gray-600">Mekanik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>`;

const newTh = `<th className="text-left px-4 py-3 font-medium text-gray-600">Mekanik</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Modal</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Untung</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Total Tagihan</th>`;
content = content.replace(oldTh, newTh);

// Replace table body
const oldTd = `<td className="px-4 py-3 text-gray-800 font-medium">{(trx.mechanics as any)?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(trx.total)}</td>`;

const newTd = `<td className="px-4 py-3 text-gray-800 font-medium">{(trx.mechanics as any)?.name || '-'}</td>
                    <td className="px-4 py-3 text-right text-red-600 hidden md:table-cell">{formatRupiah(trx.modal)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600 hidden sm:table-cell">{formatRupiah(trx.untung)}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(trx.total)}</td>`;
content = content.replace(oldTd, newTd);

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', content);
