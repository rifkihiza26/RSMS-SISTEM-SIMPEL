const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Replace expenseRows build
const oldExpenseRows = `    const expenseRows = expenses.map(e => \`
      <tr>
        <td>\${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${e.category}</td>
        <td>\${e.description || '-'}</td>
        <td class="right bold red">-\${formatRupiah(e.amount)}</td>
      </tr>
    \`).join('')`;

const newExpenseRows = `    const expenseOpsRows = expenses.filter(e => !isBelanja(e.category)).map(e => \`
      <tr>
        <td>\${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${e.category}</td>
        <td>\${e.description || '-'}</td>
        <td class="right bold red">-\${formatRupiah(e.amount)}</td>
      </tr>
    \`).join('')

    const expenseBelanjaRows = expenses.filter(e => isBelanja(e.category)).map(e => \`
      <tr>
        <td>\${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${e.category}</td>
        <td>\${e.description || '-'}</td>
        <td class="right bold" style="color:#ea580c">\${formatRupiah(e.amount)}</td>
      </tr>
    \`).join('')

    const piutangRows = rekapanWithDetail.filter(t => t.sisa > 0).map(t => \`
      <tr>
        <td>\${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${t.customer_name || '-'}</td>
        <td>\${t.motor}</td>
        <td>\${t.mekanik}</td>
        <td class="right">\${formatRupiah(t.total)}</td>
        <td class="right green">\${formatRupiah(t.amount_paid || 0)}</td>
        <td class="right bold red">\${formatRupiah(t.sisa)}</td>
        <td class="center"><span class="badge badge-yellow">\${t.payment_status || 'DP'}</span></td>
      </tr>
    \`).join('')`;

code = code.replace(oldExpenseRows, newExpenseRows);

// 2. Replace expense section in PDF
const oldPdfExpense = `      \${expenses.length > 0 && mechanicFilter === 'ALL' ? \`
      <div class="section">DETAIL PENGELUARAN</div>
      <table>
        <thead><tr><th width="20%">Tanggal</th><th width="25%">Kategori</th><th width="35%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>\${expenseRows}</tbody>
      </table>\` : ''}

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }`;

const newPdfExpense = `      \${expenses.filter(e => !isBelanja(e.category)).length > 0 && mechanicFilter === 'ALL' ? \`
      <div class="section">PENGELUARAN OPERASIONAL & GAJI</div>
      <table>
        <thead><tr><th width="15%">Tanggal</th><th width="25%">Kategori</th><th width="40%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>\${expenseOpsRows}</tbody>
        <tfoot><tr><td colspan="3" style="padding:6px 8px; font-weight:bold;">Total Pengeluaran Ops & Gaji</td><td class="right bold red" style="padding:6px 8px;">-\${formatRupiah(pengeluaranOperasional)}</td></tr></tfoot>
      </table>\` : ''}

      \${expenses.filter(e => isBelanja(e.category)).length > 0 && mechanicFilter === 'ALL' ? \`
      <div class="section" style="background:#92400e;">BELANJA STOK / PARTS (CATATAN ARUS KAS)</div>
      <p style="font-size:11px; color:#92400e; background:#fef3c7; border:1px solid #fcd34d; border-radius:6px; padding:8px 12px; margin-bottom:8px;">
        Catatan: Belanja stok di bawah ini sudah/akan terhitung sebagai Modal HPP saat parts digunakan di nota rekapan. Angka ini hanya rekaman arus kas keluar, tidak mengurangi laba bersih.
      </p>
      <table>
        <thead><tr><th width="15%">Tanggal</th><th width="25%">Kategori</th><th width="40%">Keterangan</th><th width="20%" class="right">Nominal (Rp)</th></tr></thead>
        <tbody>\${expenseBelanjaRows}</tbody>
        <tfoot><tr><td colspan="3" style="padding:6px 8px; font-weight:bold;">Total Belanja Stok (Info Arus Kas)</td><td class="right bold" style="color:#ea580c; padding:6px 8px;">\${formatRupiah(pengeluaranBelanjaParts)}</td></tr></tfoot>
      </table>\` : ''}

      \${rekapanWithDetail.filter(t => t.sisa > 0).length > 0 && mechanicFilter === 'ALL' ? \`
      <div class="section" style="background:#b45309;">PIUTANG BELUM LUNAS</div>
      <table>
        <thead><tr><th>Tanggal</th><th>Pelanggan</th><th>Motor</th><th>Mekanik</th><th class="right">Total</th><th class="right">Dibayar</th><th class="right">Sisa Hutang</th><th class="center">Status</th></tr></thead>
        <tbody>\${piutangRows}</tbody>
        <tfoot><tr><td colspan="6" style="padding:6px 8px; font-weight:bold;">Total Piutang Belum Lunas</td><td class="right bold red" style="padding:6px 8px;">\${formatRupiah(totalPiutang)}</td><td></td></tr></tfoot>
      </table>\` : ''}

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }`;

code = code.replace(oldPdfExpense, newPdfExpense);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
