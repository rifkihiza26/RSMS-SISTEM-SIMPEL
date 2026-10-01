const fs = require('fs');

let code = fs.readFileSync('src/features/dashboard/Dashboard.tsx', 'utf-8');

// We need to add fetching for 'transactions' list to useDashboardData so we can include it in the PDF/Excel detail.
// Let's rewrite useDashboardData completely in a safer way.

const newHookCode = `
function useDashboardData(startDate: string, endDate: string, periodLabel: string) {
  const { data: monthItems = [] } = useQuery({
    queryKey: ['dashboard', 'items', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_items').select('item_type, subtotal, quantity, modal_price, created_at')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
      return data ?? []
    }
  })

  const { data: monthExpenses = [] } = useQuery({
    queryKey: ['dashboard', 'expenses', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('expenses').select('amount, category, date, description')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
      return data ?? []
    }
  })
  
  const { data: detailTransactions = [] } = useQuery({
    queryKey: ['dashboard', 'detail-tx', startDate, endDate],
    queryFn: async () => {
      const { data } = await supabase.from('transactions')
        .select('transaction_number, total, created_at, notes, payment_method, customer_name')
        .gte('created_at', startDate + 'T00:00:00Z')
        .lte('created_at', endDate + 'T23:59:59Z')
        .order('created_at', { ascending: true })
      return data ?? []
    }
  })

  const totalJasa = monthItems.filter(i => ['SERVICE', 'MANUAL_JASA'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + (i.subtotal || 0), 0)
  const totalModalBarang = monthItems.filter(i => ['PRODUCT', 'MANUAL_BARANG', 'MANUAL'].includes(i.item_type)).reduce((s, i) => s + ((i.modal_price || 0) * (i.quantity || 1)), 0)

  const totalGaji = monthExpenses.filter(e => e.category === 'Penggajian' || e.category === 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)
  const totalPengeluaranLain = monthExpenses.filter(e => e.category !== 'Penggajian' && e.category !== 'PENGGAJIAN').reduce((s, e) => s + (e.amount || 0), 0)

  const profitKotor = totalJasa + (totalBarang - totalModalBarang)
  const profitBersih = profitKotor - (totalGaji + totalPengeluaranLain)

  function downloadPDF() {
    const win = window.open('', '_blank')
    if (!win) return
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
        .sum-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #eee; }
        .sum-row.total { border-bottom: none; font-weight: bold; font-size: 14px; border-top: 2px solid #ccc; margin-top: 4px; padding-top: 8px; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
      </style>
      </head><body>
      
      <h1>HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP</h1>
      <div class="sub">Periode: \${periodLabel}</div>
      
      <div class="summary-box">
        <h2 style="margin-top:0; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">Ringkasan Laba Rugi</h2>
        <div class="summary-grid">
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PEMASUKAN (INCOME)</div>
            <div class="sum-row"><span>Total Pendapatan Jasa:</span> <span class="text-green">\${formatRupiah(totalJasa)}</span></div>
            <div class="sum-row"><span>Total Penjualan Parts:</span> <span class="text-green">\${formatRupiah(totalBarang)}</span></div>
            <div class="sum-row total"><span>TOTAL KOTOR:</span> <span class="text-green">\${formatRupiah(totalJasa + totalBarang)}</span></div>
            <br/>
            <div class="sum-row"><span>Harga Pokok / Modal Parts:</span> <span class="text-red">-\${formatRupiah(totalModalBarang)}</span></div>
            <div class="sum-row total"><span>ESTIMASI LABA KOTOR:</span> <span class="text-blue">\${formatRupiah(profitKotor)}</span></div>
          </div>
          <div class="sum-col">
            <div class="bold" style="margin-bottom: 10px;">PENGELUARAN (OUTCOME)</div>
            <div class="sum-row"><span>Gaji Mekanik & Karyawan:</span> <span class="text-red">\${formatRupiah(totalGaji)}</span></div>
            <div class="sum-row"><span>Operasional & Lainnya:</span> <span class="text-red">\${formatRupiah(totalPengeluaranLain)}</span></div>
            <div class="sum-row total"><span>TOTAL PENGELUARAN:</span> <span class="text-red">\${formatRupiah(totalGaji + totalPengeluaranLain)}</span></div>
            <br/>
            <div class="sum-row total" style="font-size: 18px; border-top: 3px solid #111;">
              <span>LABA BERSIH:</span> 
              <span class="\${profitBersih >= 0 ? 'text-green' : 'text-red'}">\${formatRupiah(profitBersih)}</span>
            </div>
          </div>
        </div>
      </div>

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
      </table>

      <div style="margin-top:40px; font-size:11px; color:#999; text-align:center;">Dokumen ini digenerate secara otomatis oleh sistem RSMS pada \${new Date().toLocaleString('id-ID')}</div>
      <script>window.print();</script>
      </body></html>
    \`)
    win.document.close()
  }

  function downloadExcel() {
    const wb = XLSX.utils.book_new()
    
    // Sheet 1: Ringkasan
    const labaData = [
      ['HASIL REKAPAN & BUKU KAS - RAKYAT SINTING MATIC SHOP'],
      [\`Periode: \${periodLabel}\`],
      [],
      ['=== PEMASUKAN ==='],
      ['Keterangan', 'Jumlah (Rp)'],
      ['Pendapatan Jasa', totalJasa],
      ['Pendapatan Barang / Part', totalBarang],
      ['TOTAL PEMASUKAN', totalJasa + totalBarang],
      [],
      ['=== HPP & LABA KOTOR ==='],
      ['Modal / HPP Barang', totalModalBarang],
      ['ESTIMASI LABA KOTOR', profitKotor],
      [],
      ['=== PENGELUARAN ==='],
      ['Penggajian Mekanik', totalGaji],
      ['Operasional Bengkel', totalPengeluaranLain],
      ['TOTAL PENGELUARAN', totalGaji + totalPengeluaranLain],
      [],
      ['=== RINGKASAN ==='],
      ['LABA BERSIH', profitBersih],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(labaData)
    ws1['!cols'] = [{ wch: 40 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Laba Rugi')

    // Sheet 2: Transaksi Detail
    const incRows = [
      ['DETAIL PEMASUKAN', 'No. Trx', 'Pelanggan', 'Keterangan', 'Jumlah (Rp)'],
      ...detailTransactions.map(t => [new Date(t.created_at).toLocaleString('id-ID'), t.transaction_number, t.customer_name || '-', t.notes || 'Kasir', t.total])
    ]
    const ws2 = XLSX.utils.aoa_to_sheet(incRows)
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Detail Pemasukan')

    // Sheet 3: Pengeluaran Detail
    const expRows = [
      ['DETAIL PENGELUARAN', 'Kategori', 'Tanggal', 'Jumlah (Rp)'],
      ...monthExpenses.map(e => [e.description || '-', e.category, e.date, e.amount])
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(expRows)
    ws3['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 14 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Detail Pengeluaran')

    XLSX.writeFile(wb, \`Rekapan-\${periodLabel.replace(/ /g, '-')}.xlsx\`)
  }

  return { totalJasa, totalBarang, totalPengeluaranLain, profitKotor, downloadPDF, downloadExcel }
}
`

const startIndex = code.indexOf('function useDashboardData');
const endIndex = code.indexOf('// ------------------------------------------\n// OWNER DASHBOARD');

if (startIndex > -1 && endIndex > -1) {
    code = code.substring(0, startIndex) + newHookCode + code.substring(endIndex);
    fs.writeFileSync('src/features/dashboard/Dashboard.tsx', code);
    console.log('Success rewriting useDashboardData');
} else {
    console.log('Failed to find boundaries');
}
