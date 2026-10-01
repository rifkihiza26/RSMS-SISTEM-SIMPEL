const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldPdfStart = `  // Download PDF - Full Detail
  function handleDownloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return

    const rekapanRows = rekapanWithDetail.map(t => \`
      <tr>
        <td>\${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${t.customer_name || '-'}</td>
        <td>\${t.motor}</td>
        <td>\${t.mekanik}</td>
        <td class="right">\${formatRupiah(t.totalJasa)}</td>
        <td class="right">\${formatRupiah(t.totalPart)}</td>
        <td class="right red">\${formatRupiah(t.totalModal)}</td>
        <td class="right green">\${formatRupiah(t.totalUntung)}</td>
        <td class="right bold">\${formatRupiah(t.total)}</td>
        <td class="center">
          <span class="badge \${t.payment_status === 'LUNAS' ? 'badge-green' : t.payment_status === 'DP' ? 'badge-yellow' : 'badge-red'}">
            \${t.payment_status || 'LUNAS'}
          </span>
        </td>
      </tr>
    \`).join('')

    const kasirRows = kasirTrx.map(t => \`
      <tr>
        <td>\${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td>\${t.transaction_number}</td>
        <td>\${t.payment_method || '-'}</td>
        <td class="right bold green">\${formatRupiah(t.total)}</td>
      </tr>
    \`).join('')

    const expenseRows = expenses.map(e => \`
      <tr>
        <td>\${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${e.category}</td>
        <td>\${e.description || '-'}</td>
        <td class="right bold red">\${formatRupiah(e.amount)}</td>
      </tr>
    \`).join('')

    win.document.write(\`
      <html><head><title>Laporan Servis - \${periodLabel}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 28px; font-size: 12px; color: #111; max-width: 1100px; margin: auto; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 2px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 28px; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .sum-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
        .sum-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
        .sum-val { font-size: 16px; font-weight: bold; }
        .green { color: #16a34a; }
        .red { color: #dc2626; }
        .blue { color: #2563eb; }
        .orange { color: #ea580c; }
        .section { background: #1e293b; color: white; padding: 8px 14px; font-weight: bold; font-size: 13px; margin-top: 24px; border-radius: 6px 6px 0 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 11px; }
        th { background: #f8fafc; padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: 600; color: #374151; }
        td { padding: 7px 8px; border: 1px solid #e2e8f0; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef08a; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
      </style></head><body>

      <h1>RAKYAT SINTING MATIC SHOP</h1>
      <div class="subtitle">Laporan Rekapan Servis & Keuangan · \${periodLabel}</div>

      <div class="summary-grid">
        <div class="sum-card"><div class="sum-label">Total Servis (Rekapan)</div><div class="sum-val green">\${formatRupiah(totalRekapan)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Kasir</div><div class="sum-val blue">\${formatRupiah(totalKasir)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Modal Parts</div><div class="sum-val red">\${formatRupiah(totalModal)}</div></div>
        <div class="sum-card"><div class="sum-label">Total Pengeluaran</div><div class="sum-val orange">\${formatRupiah(totalPengeluaran)}</div></div>
        <div class="sum-card"><div class="sum-label">Jasa Mekanik</div><div class="sum-val green">\${formatRupiah(totalJasaAll)}</div></div>
        <div class="sum-card"><div class="sum-label">Penjualan Parts</div><div class="sum-val blue">\${formatRupiah(totalPartAll)}</div></div>
        <div class="sum-card"><div class="sum-label">Piutang Belum Lunas</div><div class="sum-val red">\${formatRupiah(totalPiutang)}</div></div>
        <div class="sum-card" style="background:#eff6ff; border-color:#93c5fd;"><div class="sum-label">ESTIMASI LABA BERSIH</div><div class="sum-val blue">\${formatRupiah(labaRekapan)}</div></div>
      </div>

      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
      <table>
        <thead><tr>
          <th>Tanggal</th><th>Pelanggan</th><th>Motor / Plat</th><th>Mekanik</th>
          <th class="right">Jasa</th><th class="right">Parts</th>
          <th class="right">Modal</th><th class="right">Untung</th>
          <th class="right">Total</th><th class="center">Status</th>
        </tr></thead>
        <tbody>\${rekapanRows || '<tr><td colspan="10" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada rekapan di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">🧾 TRANSAKSI KASIR</div>
      <table>
        <thead><tr><th>Waktu</th><th>No. Nota</th><th>Metode Bayar</th><th class="right">Total</th></tr></thead>
        <tbody>\${kasirRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada transaksi kasir di periode ini</td></tr>'}</tbody>
      </table>

      <div class="section">💸 DETAIL PENGELUARAN</div>
      <table>
        <thead><tr><th>Tanggal</th><th>Kategori</th><th>Keterangan</th><th class="right">Nominal</th></tr></thead>
        <tbody>\${expenseRows || '<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Tidak ada pengeluaran di periode ini</td></tr>'}</tbody>
      </table>

      <div class="footer">Digenerate oleh sistem RSMS · \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }`;

const newPdfCode = `  // Download PDF - Full Detail
  function handleDownloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return

    const rekapanRows = rekapanWithDetail.map(t => \`
      <tr>
        <td>\${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${t.customer_name || '-'}</td>
        <td>\${t.motor}</td>
        <td>\${t.mekanik}</td>
        <td class="right">\${formatRupiah(t.totalJasa)}</td>
        <td class="right">\${formatRupiah(t.totalPart)}</td>
        <td class="right red">-\${formatRupiah(t.totalModal)}</td>
        <td class="right green">\${formatRupiah(t.totalUntung)}</td>
        <td class="right bold">\${formatRupiah(t.total)}</td>
        <td class="center">
          <span class="badge \${t.payment_status === 'LUNAS' ? 'badge-green' : t.payment_status === 'DP' ? 'badge-yellow' : 'badge-red'}">
            \${t.payment_status || 'LUNAS'}
          </span>
        </td>
      </tr>
    \`).join('')

    const kasirRows = kasirTrx.map(t => \`
      <tr>
        <td>\${new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
        <td>\${t.transaction_number}</td>
        <td>\${t.payment_method || '-'}</td>
        <td class="right bold green">\${formatRupiah(t.total)}</td>
      </tr>
    \`).join('')

    const expenseRows = expenses.map(e => \`
      <tr>
        <td>\${new Date(e.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
        <td>\${e.category}</td>
        <td>\${e.description || '-'}</td>
        <td class="right bold red">-\${formatRupiah(e.amount)}</td>
      </tr>
    \`).join('')

    const labaKotor = totalRekapan + totalKasir - totalModal;

    win.document.write(\`
      <html><head><title>Buku Kas / Laporan - \${periodLabel}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 32px; font-size: 12px; color: #111; max-width: 1000px; margin: auto; }
        h1 { font-size: 20px; margin-bottom: 4px; text-align: center; }
        .sub { color: #666; margin-bottom: 30px; font-size: 13px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
        th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f4f4f5; font-weight: bold; color: #333; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .section { background: #1f2937; color: white; padding: 10px; font-weight: bold; margin-top: 30px; margin-bottom: 0px; font-size: 14px; }
        .summary-box { border: 2px solid #1f2937; padding: 20px; margin-bottom: 30px; border-radius: 8px; }
        .summary-grid { display: flex; justify-content: space-between; }
        .sum-col { width: 48%; }
        .sum-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; font-size: 13px; }
        .sum-row.total { border-bottom: none; font-weight: bold; font-size: 14px; border-top: 2px solid #ccc; margin-top: 4px; padding-top: 8px; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-yellow { background: #fef08a; color: #854d0e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
      </style>
      </head><body>
      
      <h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: \${periodLabel}</div>
      
      <div class="summary-box">
        <h2 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Ringkasan Keuangan (Laba Rugi)</h2>
        <div class="summary-grid">
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PEMASUKAN (INCOME)</div>
            <div class="sum-row"><span>Total Rekapan Servis:</span> <span class="text-green">\${formatRupiah(totalRekapan)}</span></div>
            <div class="sum-row"><span>Total Penjualan Kasir:</span> <span class="text-green">\${formatRupiah(totalKasir)}</span></div>
            <div class="sum-row total"><span>TOTAL KOTOR:</span> <span class="text-green">\${formatRupiah(totalRekapan + totalKasir)}</span></div>
            <br/>
            <div class="sum-row"><span>Harga Pokok / Modal Parts:</span> <span class="text-red">-\${formatRupiah(totalModal)}</span></div>
            <div class="sum-row total"><span>ESTIMASI LABA KOTOR:</span> <span class="text-blue">\${formatRupiah(labaKotor)}</span></div>
          </div>
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PENGELUARAN (OUTCOME)</div>
            <div class="sum-row"><span>Pengeluaran Operasional & Gaji:</span> <span class="text-red">\${formatRupiah(totalPengeluaran)}</span></div>
            <div class="sum-row total"><span>TOTAL PENGELUARAN:</span> <span class="text-red">\${formatRupiah(totalPengeluaran)}</span></div>
            <br/><br/><br/>
            <div class="sum-row total" style="font-size: 18px; border-top: 3px solid #111;">
              <span>LABA BERSIH:</span> 
              <span class="\${labaRekapan >= 0 ? 'text-green' : 'text-red'}">\${formatRupiah(labaRekapan)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">📋 DETAIL TRANSAKSI REKAPAN SERVIS</div>
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
      </table>

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }`;

code = code.replace(oldPdfStart, newPdfCode);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
