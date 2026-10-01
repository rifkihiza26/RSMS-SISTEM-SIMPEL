const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// 1. Update labaRekapan & add untungParts
const labaStart = `  const labaRekapan = totalUntung + totalKasir - totalPengeluaran`;
const labaNew = `  const untungParts = totalPartAll - totalModal
  const labaRekapan = totalJasaAll + untungParts + totalKasir - totalPengeluaran`;
code = code.replace(labaStart, labaNew);

// 2. Update Summary Cards UI
const oldSummaryBlock = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Rekapan Servis', value: formatRupiah(totalRekapan), color: 'text-green-600', bg: 'bg-green-50', icon: Wrench },
          { label: 'Transaksi Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', icon: ShoppingCart },
          { label: 'Total Modal Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
          { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', icon: Wallet },
          { label: 'Jasa Mekanik', value: formatRupiah(totalJasaAll), color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
          { label: 'Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-600', bg: 'bg-blue-50', icon: ShoppingCart },
          { label: 'Total Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', icon: TrendingDown },
          { label: 'Estimasi Laba Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-700' : 'text-red-600', bg: 'bg-blue-50', icon: Wallet },
        ].map(c => (
          <div key={c.label} className={\`\${c.bg} border rounded-xl p-4\`}>
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={\`w-4 h-4 \${c.color}\`} />
              <p className="text-xs text-gray-500 font-medium">{c.label}</p>
            </div>
            <p className={\`text-lg font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>`;

const newSummaryBlock = `<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '🔨 Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🔩 Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '📦 Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '✅ Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: '🛒 Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: '💸 Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: '⚠️ Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
          { label: '🏆 Total Pendapatan Bersih', value: formatRupiah(labaRekapan), color: labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700', bg: 'bg-blue-50', border: 'border-blue-300' },
        ].map(c => (
          <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4\`}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={\`text-lg font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>`;
code = code.replace(oldSummaryBlock, newSummaryBlock);

// 3. CSS for PDF
const oldStyle = `        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 28px; font-size: 12px; color: #111; max-width: 1100px; margin: auto; }
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
        .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }`;

const newStyle = `        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 28px; font-size: 12px; color: #111; max-width: 1100px; margin: auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1 { font-size: 22px; text-align: center; margin-bottom: 2px; }
        .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 28px; }
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
        @media print {
          body { margin: 0; padding: 16px; }
          .summary-box { page-break-inside: avoid; }
          table { page-break-inside: auto; border-collapse: collapse; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          .section { page-break-before: auto; }
        }`;
code = code.replace(oldStyle, newStyle);

// 4. Update the summary-box block inside handleDownloadPDF
// Currently it is `<div class="summary-box"> ... </div>` (but the old Reports.tsx uses `.summary-grid` with `.sum-card`)
// Wait! Earlier I changed Reports.tsx to match Dashboard.tsx "Buku Kas" style summary!
// Let's grab the actual string from Reports.tsx.
const oldSummaryBoxRegex = /<div class="summary-box">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

// Let me use a custom script approach to find where `<div class="summary-box">` starts and ends.
