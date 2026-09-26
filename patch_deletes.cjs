const fs = require('fs')

function patchIncome() {
  let content = fs.readFileSync('src/features/income/Income.tsx', 'utf8')
  if (!content.includes('Trash')) content = content.replace(/import \{.*?\} from 'lucide-react'/, match => match.replace('}', ', Trash }'))
  
  // Add delete mutation
  if (!content.includes('deleteMutation')) {
    const deleteMut = `
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incomes'] })
  })
`
    content = content.replace('const saveMutation =', deleteMut + '\n  const saveMutation =')
  }

  // Add delete button to UI
  if (!content.includes('deleteMutation.mutate(')) {
    content = content.replace(
      /<td className="px-4 py-3 text-right font-semibold text-green-600">\{formatRupiah\(i.amount\)\}<\/td>/g,
      '<td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(i.amount)}</td>\n                    <td className="px-4 py-3 text-right">{isOwner && <button onClick={() => { if(confirm(\'Yakin hapus data ini?\')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}</td>'
    )
    content = content.replace(
      /<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah<\/th>/,
      '<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>\n                  <th className="text-right px-4 py-3 font-semibold text-gray-600 w-16"></th>'
    )
  }
  fs.writeFileSync('src/features/income/Income.tsx', content)
}

function patchExpenses() {
  let content = fs.readFileSync('src/features/expenses/Expenses.tsx', 'utf8')
  if (!content.includes('Trash')) content = content.replace(/import \{.*?\} from 'lucide-react'/, match => match.replace('}', ', Trash }'))
  
  if (!content.includes('deleteMutation')) {
    const deleteMut = `
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] })
  })
`
    content = content.replace('const saveMutation =', deleteMut + '\n  const saveMutation =')
  }

  if (!content.includes('deleteMutation.mutate(')) {
    content = content.replace(
      /<td className="px-4 py-3 text-right font-semibold text-red-600">-\{formatRupiah\(i.amount\)\}<\/td>/g,
      '<td className="px-4 py-3 text-right font-semibold text-red-600">-{formatRupiah(i.amount)}</td>\n                    <td className="px-4 py-3 text-right">{isOwner && <button onClick={() => { if(confirm(\'Yakin hapus pengeluaran ini?\')) deleteMutation.mutate(i.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}</td>'
    )
    content = content.replace(
      /<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah<\/th>/,
      '<th className="text-right px-4 py-3 font-semibold text-gray-600">Jumlah</th>\n                  <th className="text-right px-4 py-3 font-semibold text-gray-600 w-16"></th>'
    )
  }
  fs.writeFileSync('src/features/expenses/Expenses.tsx', content)
}

function patchTransactions() {
  let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')
  
  // imports
  if (!content.includes('Trash')) content = content.replace(/import \{.*?\} from 'lucide-react'/, match => match.replace('}', ', Trash, Printer, Check }'))
  if (!content.includes('useAuth')) content = content.replace(/import .*? from '@tanstack\/react-query'/, "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'\nimport { useAuth } from '@/contexts/AuthContext'")
  
  // downloadPDF
  if (!content.includes('downloadPDF')) content = content.replace(/import \{.*?\} from '@\/lib\/utils'/, "import { formatRupiah, formatDateShort } from '@/lib/utils'\nimport { downloadPDF } from '@/lib/pdf'")
  
  // useAuth & mutations
  if (!content.includes('const { isOwner }')) content = content.replace("export function Transactions() {", "export function Transactions() {\n  const { isOwner } = useAuth()\n  const qc = useQueryClient()")
  
  if (!content.includes('deleteMutation')) {
    const deleteMut = `
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] })
  })
`
    content = content.replace("const filtered =", deleteMut + '\n  const filtered =')
  }

  // Delete button in row
  if (!content.includes('deleteMutation.mutate(t.id)')) {
    content = content.replace(
      /<td className="px-4 py-3 text-right">([\s\S]*?)<\/td>/,
      `<td className="px-4 py-3 text-right flex justify-end gap-1">
                      <button onClick={() => setDetailId(t.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10" title="Detail"><Eye className="h-4 w-4" /></button>
                      {isOwner && <button onClick={() => { if(confirm('Yakin hapus transaksi beserta itemnya? Pemasukan terkait akan terhapus juga otomatis jika ada cascade, tapi stok tidak kembali otomatis.')) deleteMutation.mutate(t.id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Hapus"><Trash className="w-4 h-4" /></button>}
                    </td>`
    )
  }

  // Reprint layout in modal
  if (!content.includes('id="reprint-receipt"')) {
    const reprintHtml = `
              <div className="flex gap-2">
                <button onClick={() => downloadPDF('reprint-receipt', 'Invoice-' + detailTrx.transaction_number)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Cetak PDF</button>
              </div>

              {/* Hidden Receipt Format for printing */}
              <div className="hidden">
                <div id="reprint-receipt" className="bg-white text-black w-[400px] p-6 text-sm font-sans mx-auto">
                  <div className="text-center mb-6">
                    <img src="/logo.png" alt="Logo" className="h-14 mx-auto mb-2 grayscale" />
                    <h2 className="text-xl font-bold font-serif mb-1">RAKYAT SINTING</h2>
                    <p className="text-xs text-gray-600 leading-tight">Jln. Pejaten Raya RT.01/RW.07 No. 3<br />Kecamatan Pasar Minggu, Jakarta Selatan<br />WA: 0813-8760-7676</p>
                  </div>
                  <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4 text-xs space-y-1">
                    <div className="flex justify-between"><span>No: {detailTrx.transaction_number}</span><span>{formatDateShort(detailTrx.created_at)}</span></div>
                    <div className="flex justify-between"><span>KSR: {detailTrx.profiles?.full_name ?? '-'}</span><span>{detailTrx.notes || '-'}</span></div>
                  </div>
                  <div className="space-y-3 mb-4">
                    {detailItems.map(item => (
                      <div key={item.id} className="text-xs">
                        <div className="font-semibold">{item.item_name}</div>
                        <div className="flex justify-between text-gray-600">
                          <span>{item.quantity} x {formatRupiah(item.unit_price)}</span>
                          <span>{formatRupiah(item.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                    {detailTrx.discount > 0 && <div className="flex justify-between text-gray-600"><span>Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                    <div className="flex justify-between font-bold text-sm pt-1"><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                    <div className="flex justify-between pt-1"><span>{detailTrx.payment_method}</span><span>{detailTrx.payment_method === 'CASH' ? formatRupiah(detailTrx.paid_amount) : formatRupiah(detailTrx.total)}</span></div>
                    {detailTrx.payment_method === 'CASH' && <div className="flex justify-between"><span>Kembali</span><span>{formatRupiah(detailTrx.change_amount)}</span></div>}
                  </div>
                  <div className="text-center mt-8 text-xs text-gray-500 italic border-t border-dashed border-gray-300 pt-4">Terima kasih atas kunjungan Anda.<br/>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</div>
                </div>
              </div>
`
    content = content.replace("</div>\n            </div>\n          </div>", reprintHtml + "</div>\n            </div>\n          </div>")
  }

  fs.writeFileSync('src/features/transactions/Transactions.tsx', content)
}

patchIncome()
patchExpenses()
patchTransactions()
