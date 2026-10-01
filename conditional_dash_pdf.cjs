const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

const oldBlock = `      <div class="section">DETAIL TRANSAKSI PEMASUKAN (INCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">No. Trx</th>
            <th width="20%">Pelanggan</th>
            <th width="30%">Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          \${detailTransactions.length === 0 ? '<tr><td colspan="5" class="center">Tidak ada transaksi pemasukan di periode ini</td></tr>' : ''}
          \${detailTransactions.map(tx => \`
            <tr>
              <td>\${new Date(tx.created_at).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
              <td>\${tx.transaction_number}</td>
              <td>\${tx.customer_name || '-'}</td>
              <td>\${tx.notes || 'Transaksi Kasir'}</td>
              <td class="right text-green bold">\${formatRupiah(tx.total)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>

      <div class="section">DETAIL PENGELUARAN (OUTCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">Kategori</th>
            <th width="50%">Deskripsi / Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          \${monthExpenses.length === 0 ? '<tr><td colspan="4" class="center">Tidak ada pengeluaran di periode ini</td></tr>' : ''}
          \${monthExpenses.map(ex => \`
            <tr>
              <td>\${new Date(ex.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
              <td>\${ex.category}</td>
              <td>\${ex.description || '-'}</td>
              <td class="right text-red bold">\${formatRupiah(ex.amount)}</td>
            </tr>
          \`).join('')}
        </tbody>
      </table>`;

const newBlock = `      \${detailTransactions.length > 0 ? \`
      <div class="section">DETAIL TRANSAKSI PEMASUKAN (INCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">No. Trx</th>
            <th width="20%">Pelanggan</th>
            <th width="30%">Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          \${detailTransactions.map(tx => \\\`
            <tr>
              <td>\\\${new Date(tx.created_at).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
              <td>\\\${tx.transaction_number}</td>
              <td>\\\${tx.customer_name || '-'}</td>
              <td>\\\${tx.notes || 'Transaksi Kasir'}</td>
              <td class="right text-green bold">\\\${formatRupiah(tx.total)}</td>
            </tr>
          \\\`).join('')}
        </tbody>
      </table>\` : ''}

      \${monthExpenses.length > 0 ? \`
      <div class="section">DETAIL PENGELUARAN (OUTCOME)</div>
      <table>
        <thead>
          <tr>
            <th width="15%">Tanggal</th>
            <th width="20%">Kategori</th>
            <th width="50%">Deskripsi / Keterangan</th>
            <th width="15%" class="right">Nominal (Rp)</th>
          </tr>
        </thead>
        <tbody>
          \${monthExpenses.map(ex => \\\`
            <tr>
              <td>\\\${new Date(ex.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
              <td>\\\${ex.category}</td>
              <td>\\\${ex.description || '-'}</td>
              <td class="right text-red bold">\\\${formatRupiah(ex.amount)}</td>
            </tr>
          \\\`).join('')}
        </tbody>
      </table>\` : ''}`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
  console.log('Successfully updated Dashboard.tsx');
} else {
  console.log('Failed to find exact block in Dashboard.tsx');
}
