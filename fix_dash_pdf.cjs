const fs = require('fs');
let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

const regex = /function downloadPDF\(\) \{[\s\S]*?win\.document\.write\(\`/g;

const replacement = `function downloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return

    const incomeRows = detailTransactions.map(tx => \`
      <tr>
        <td>\${new Date(tx.created_at).toLocaleString('id-ID', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
        <td>\${tx.transaction_number}</td>
        <td>\${tx.customer_name || '-'}</td>
        <td>\${tx.notes || 'Transaksi Kasir'}</td>
        <td class="right text-green bold">\${formatRupiah(tx.total)}</td>
      </tr>
    \`).join('');

    const expenseRows = monthExpenses.map(ex => \`
      <tr>
        <td>\${new Date(ex.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})}</td>
        <td>\${ex.category}</td>
        <td>\${ex.description || '-'}</td>
        <td class="right text-red bold">\${formatRupiah(ex.amount)}</td>
      </tr>
    \`).join('');

    win.document.write(\``;

code = code.replace(regex, replacement);

const htmlRegex = /\$\{detailTransactions\.length > 0 \? \`[\s\S]*?<\/table>\` : ''\}/g;
const htmlReplacement = `\${detailTransactions.length > 0 ? \`
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
          \${incomeRows}
        </tbody>
      </table>\` : ''}`;
code = code.replace(htmlRegex, htmlReplacement);

const expRegex = /\$\{monthExpenses\.length > 0 \? \`[\s\S]*?<\/table>\` : ''\}/g;
const expReplacement = `\${monthExpenses.length > 0 ? \`
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
          \${expenseRows}
        </tbody>
      </table>\` : ''}`;
code = code.replace(expRegex, expReplacement);

fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
