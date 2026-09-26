import re

with open('src/features/income/Income.tsx', 'r') as f:
    c = f.read()

# Replace button area
old_buttons = """        {(isAdmin || isOwner) && (
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Pemasukan Manual
          </button>
        )}"""
new_buttons = """        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Cetak PDF
          </button>
          {(isAdmin || isOwner) && (
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Pemasukan Manual
            </button>
          )}
        </div>"""
c = c.replace(old_buttons, new_buttons)

# Add printable area before last </div>
print_area = """
      {/* Printable Area */}
      <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 overflow-visible text-black text-sm">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Rakyat Sinting Matic Shop</h1>
          <h2 className="text-lg font-semibold mt-1">Laporan Rincian Pemasukan</h2>
          <p className="text-gray-600 mt-1">
            Periode: {dateFilter === 'today' ? formatDateShort(new Date()) : dateFilter === 'month' ? 'Bulan Ini' : dateFilter === 'custom' && startDate && endDate ? `${formatDateShort(new Date(startDate))} - ${formatDateShort(new Date(endDate))}` : 'Semua Waktu'}
          </p>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 px-2 text-left w-24">Tanggal</th>
              <th className="py-2 px-2 text-left w-32">Kategori</th>
              <th className="py-2 px-2 text-left">Keterangan</th>
              <th className="py-2 px-2 text-left w-32">Mekanik</th>
              <th className="py-2 px-2 text-left w-24">Metode</th>
              <th className="py-2 px-2 text-right w-32">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i, index) => (
              <tr key={`print-${i.id}-${index}`} className="border-b border-gray-200">
                <td className="py-2 px-2">{formatDateShort(new Date(i.date))}</td>
                <td className="py-2 px-2 font-medium">{i.category}</td>
                <td className="py-2 px-2">{i.description || '-'}</td>
                <td className="py-2 px-2">{i.transactions?.mechanics?.name || '-'}</td>
                <td className="py-2 px-2">{i.payment_method}</td>
                <td className="py-2 px-2 text-right">{formatRupiah(i.amount)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">Belum ada data untuk periode ini</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="flex justify-end mt-8">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span className="font-medium">Total CASH:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'CASH').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total QRIS:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'QRIS').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total TRANSFER:</span>
              <span>{formatRupiah(filtered.filter(i => i.payment_method === 'TRANSFER').reduce((s, i) => s + i.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-black mt-1 font-bold text-lg">
              <span>TOTAL:</span>
              <span>{formatRupiah(filtered.reduce((s, i) => s + i.amount, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"""

c = re.sub(r'    </div>\n  \)\n}\n?$', print_area, c)

with open('src/features/income/Income.tsx', 'w') as f:
    f.write(c)

