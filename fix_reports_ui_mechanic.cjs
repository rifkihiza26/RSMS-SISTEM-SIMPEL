const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

const oldCards = `      {/* Baris Rincian */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Total Pemasukan Kotor', value: formatRupiah(totalPemasukanKotor), color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
        ].map(c => (
          <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>
            <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
            <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Baris Selisih & Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        ].map(c => (
          <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>
            <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
            <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Total Pendapatan Bersih */}
      <div className={\`\${labaRekapan >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'} border rounded-xl p-4 shadow-sm\`}>
        <p className="text-sm text-gray-500 font-medium mb-1">Total Pendapatan Bersih</p>
        <p className={\`text-2xl font-bold \${labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700'}\`}>{formatRupiah(labaRekapan)}</p>
        <p className="text-xs text-gray-400 mt-1">Jasa + Untung Parts + Kasir - Pengeluaran</p>
      </div>`;

const newCards = `      {mechanicFilter === 'ALL' ? (
        <>
          {/* Baris Rincian */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Jasa Servis', value: formatRupiah(totalJasaAll), color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Penjualan Parts', value: formatRupiah(totalPartAll), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Pendapatan Kasir', value: formatRupiah(totalKasir), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Total Pemasukan Kotor', value: formatRupiah(totalPemasukanKotor), color: 'text-gray-900', bg: 'bg-gray-100', border: 'border-gray-300' },
            ].map(c => (
              <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>
                <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
                <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Baris Selisih & Ringkasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Modal / HPP Parts', value: formatRupiah(totalModal), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Untung dari Parts', value: formatRupiah(untungParts), color: untungParts >= 0 ? 'text-green-700' : 'text-red-600', bg: 'bg-green-50', border: 'border-green-200' },
              { label: 'Pengeluaran', value: formatRupiah(totalPengeluaran), color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Piutang Belum Lunas', value: formatRupiah(totalPiutang), color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
            ].map(c => (
              <div key={c.label} className={\`\${c.bg} border \${c.border} rounded-xl p-4 shadow-sm\`}>
                <p className="text-xs text-gray-500 mb-1 font-medium">{c.label}</p>
                <p className={\`text-base font-bold \${c.color}\`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Total Pendapatan Bersih */}
          <div className={\`\${labaRekapan >= 0 ? 'bg-blue-50 border-blue-300' : 'bg-red-50 border-red-300'} border rounded-xl p-4 shadow-sm\`}>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Pendapatan Bersih</p>
            <p className={\`text-2xl font-bold \${labaRekapan >= 0 ? 'text-blue-800' : 'text-red-700'}\`}>{formatRupiah(labaRekapan)}</p>
            <p className="text-xs text-gray-400 mt-1">Jasa + Untung Parts + Kasir - Pengeluaran</p>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Total Jasa Servis</p>
              <p className="text-xl font-bold text-green-700">{formatRupiah(totalJasaAll)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Penjualan Parts</p>
              <p className="text-xl font-bold text-blue-700">{formatRupiah(totalPartAll)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Modal / HPP Parts</p>
              <p className="text-xl font-bold text-red-600">-{formatRupiah(totalModal)}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1 font-medium">Untung dari Parts</p>
              <p className={\`text-xl font-bold \${untungParts >= 0 ? 'text-green-700' : 'text-red-600'}\`}>{formatRupiah(untungParts)}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Kontribusi Mekanik</p>
            <p className="text-2xl font-bold text-blue-800">{formatRupiah(totalJasaAll + untungParts)}</p>
            <p className="text-xs text-gray-500 mt-1">Jasa + Untung Parts</p>
          </div>
        </>
      )}`;

code = code.replace(oldCards, newCards);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
