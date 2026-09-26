import re

with open('src/features/expenses/Expenses.tsx', 'r') as f:
    c = f.read()

# Replace button area
old_buttons = """        <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
          <Plus className="h-4 w-4" /> Catat Pengeluaran
        </button>"""
new_buttons = """        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
            <Printer className="h-4 w-4" /> Cetak PDF
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
            <Plus className="h-4 w-4" /> Catat Pengeluaran
          </button>
        </div>"""
c = c.replace(old_buttons, new_buttons)

# Add printable area
print_area = """
      {/* Printable Area */}
      <div className="hidden print:block fixed inset-0 bg-white z-50 p-8 overflow-visible text-black text-sm">
        <div className="text-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Rakyat Sinting Matic Shop</h1>
          <h2 className="text-lg font-semibold mt-1">Laporan Rincian Pengeluaran</h2>
          <p className="text-gray-600 mt-1">
            Periode: {dateFilter === 'today' ? formatDateShort(new Date()) : dateFilter === 'month' ? 'Bulan Ini' : dateFilter === 'custom' && startDate && endDate ? `${formatDateShort(new Date(startDate))} - ${formatDateShort(new Date(endDate))}` : 'Semua Waktu'}
          </p>
        </div>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 px-2 text-left w-24">Tanggal</th>
              <th className="py-2 px-2 text-left w-32">Kategori</th>
              <th className="py-2 px-2 text-left">Keterangan / Rincian</th>
              <th className="py-2 px-2 text-left w-24">Metode</th>
              <th className="py-2 px-2 text-right w-32">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, index) => (
              <tr key={`print-${e.id}-${index}`} className="border-b border-gray-200 align-top">
                <td className="py-2 px-2">{formatDateShort(e.date)}</td>
                <td className="py-2 px-2 font-medium">
                  {e.category}
                  {e.mechanics && <div className="text-[11px] text-gray-500 mt-0.5">Mekanik: {e.mechanics.name}</div>}
                </td>
                <td className="py-2 px-2">
                  <div>{e.description || '-'}</div>
                  {e.items && e.items.length > 0 && (
                    <ul className="mt-1 pl-3 list-disc text-[11px] text-gray-600">
                      {e.items.map((it: any, i: number) => (
                        <li key={i}>{it.qty}x {it.name} (@{formatRupiah(it.price)})</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="py-2 px-2">{e.payment_method}</td>
                <td className="py-2 px-2 text-right">{formatRupiah(e.amount)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">Belum ada data untuk periode ini</td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="flex justify-end mt-8">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span className="font-medium">Total CASH:</span>
              <span>{formatRupiah(filtered.filter(e => e.payment_method === 'CASH').reduce((s, e) => s + e.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total QRIS:</span>
              <span>{formatRupiah(filtered.filter(e => e.payment_method === 'QRIS').reduce((s, e) => s + e.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium">Total TRANSFER:</span>
              <span>{formatRupiah(filtered.filter(e => e.payment_method === 'TRANSFER').reduce((s, e) => s + e.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-black mt-1 font-bold text-lg">
              <span>TOTAL:</span>
              <span>{formatRupiah(filtered.reduce((s, e) => s + e.amount, 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"""

c = re.sub(r'    </div>\n  \)\n}\n?$', print_area, c)

with open('src/features/expenses/Expenses.tsx', 'w') as f:
    f.write(c)
