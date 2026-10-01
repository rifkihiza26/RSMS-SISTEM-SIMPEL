const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldBlock = `      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Pelanggan</th><th>Motor / Plat</th><th>Mekanik</th>
          <th class="right">Jasa</th><th class="right">Parts</th>
          <th class="right">Modal</th><th class="right">Untung</th>
          <th class="right">Total</th><th class="center">Status</th>
        </tr></thead>
        <tbody>\${rekapanRows || '<tr><td colspan="10" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada rekapan di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">🧾 DETAIL TRANSAKSI KASIR (ECER)</div>
      <table>
        <thead><tr><th width="20%">Waktu</th><th width="30%">No. Nota</th><th width="30%">Metode Bayar</th><th width="20%" class="right">Total (Rp)</th></tr></thead>
        <tbody>\${kasirRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada transaksi kasir di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">💸 DETAIL PENGELUARAN</div>
      <table>
        <thead><tr><th width="20%">Tanggal</th><th width="25%">Kategori</th><th width="35%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>\${expenseRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Tidak ada pengeluaran di periode ini</td></tr>'}</tbody>
      </table>`;

const newBlock = `      \${rekapanWithDetail.length > 0 ? \`
      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Pelanggan</th><th>Motor / Plat</th><th>Mekanik</th>
          <th class="right">Jasa</th><th class="right">Parts</th>
          <th class="right">Modal</th><th class="right">Untung</th>
          <th class="right">Total</th><th class="center">Status</th>
        </tr></thead>
        <tbody>\${rekapanRows}</tbody>
      </table>\` : ''}

      \${kasirTrx.length > 0 ? \`
      <div class="section">🧾 DETAIL TRANSAKSI KASIR (ECER)</div>
      <table>
        <thead><tr><th width="20%">Waktu</th><th width="30%">No. Nota</th><th width="30%">Metode Bayar</th><th width="20%" class="right">Total (Rp)</th></tr></thead>
        <tbody>\${kasirRows}</tbody>
      </table>\` : ''}

      \${expenses.length > 0 ? \`
      <div class="section">💸 DETAIL PENGELUARAN</div>
      <table>
        <thead><tr><th width="20%">Tanggal</th><th width="25%">Kategori</th><th width="35%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>\${expenseRows}</tbody>
      </table>\` : ''}`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/features/reports/Reports.tsx', code);
  console.log('Successfully updated Reports.tsx');
} else {
  console.log('Failed to find exact block in Reports.tsx');
}
