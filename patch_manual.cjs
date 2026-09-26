const fs = require('fs');

let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

// Replace state
c = c.replace(
  "const [manualForm, setManualForm] = useState({ name: '', type: 'Jasa', price: '', qty: '1' })",
  "const [manualForm, setManualForm] = useState([{ id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }])"
);

// Replace addManual logic
const oldAddManual = \`  function addManual(e: React.FormEvent) {
    e.preventDefault(); setManualError('')
    if (!manualForm.name.trim()) return setManualError('Nama item wajib diisi.')
    const price = parseFloat(manualForm.price)
    const qty = manualForm.type === 'Jasa' ? 1 : parseInt(manualForm.qty)
    if (!price || price <= 0) return setManualError('Harga harus lebih dari 0.')
    if (!qty || qty < 1) return setManualError('Quantity harus minimal 1.')
    updateSession({ cart: [...cart, { id: crypto.randomUUID(), name: manualForm.name.trim(), type: 'MANUAL', price, qty, is_service: manualForm.type === 'Jasa' }] })
    setManualForm({ name: '', type: 'Jasa', price: '', qty: '1' })
    setManualOpen(false)
  }\`;

const newAddManual = \`  function addManual(e: React.FormEvent) {
    e.preventDefault(); setManualError('');
    
    const newItems = [];
    for (const item of manualForm) {
      if (!item.name.trim()) return setManualError('Ada item yang belum memiliki nama.');
      const price = parseFloat(item.price);
      const qty = item.type === 'Jasa' ? 1 : parseInt(item.qty);
      if (!price || price <= 0) return setManualError('Ada item dengan harga tidak valid.');
      if (!qty || qty < 1) return setManualError('Quantity harus minimal 1.');
      
      newItems.push({
        id: crypto.randomUUID(),
        name: item.name.trim(),
        type: 'MANUAL',
        price,
        qty,
        is_service: item.type === 'Jasa'
      });
    }

    updateSession({ cart: [...cart, ...newItems] });
    setManualForm([{ id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }]);
    setManualOpen(false);
  }
  
  function addManualRow() {
    setManualForm([...manualForm, { id: crypto.randomUUID(), name: '', type: 'Jasa', price: '', qty: '1' }]);
  }
  
  function removeManualRow(id: string) {
    if (manualForm.length === 1) return;
    setManualForm(manualForm.filter(item => item.id !== id));
  }
  
  function updateManualRow(id: string, field: string, value: string) {
    setManualForm(manualForm.map(item => item.id === id ? { ...item, [field]: value } : item));
  }
\`;

c = c.replace(oldAddManual, newAddManual);

// Replace modal JSX
const oldModal = \`      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Input Item Manual</h2>
              <button onClick={() => setManualOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addManual} className="p-5 space-y-4">
              {manualError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{manualError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Item <span className="text-red-500">*</span></label>
                <input value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Nama barang atau jasa" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <select value={manualForm.type} onChange={e => setManualForm(f => ({ ...f, type: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="Jasa">Jasa</option>
                  <option value="Barang">Barang</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {manualForm.type === 'Barang' ? '⚠️ Item manual tidak terhubung dengan stok produk.' : 'Item manual tidak terhubung dengan daftar jasa.'}
                </p>
              </div>
              <div className={\`grid \${manualForm.type === 'Barang' ? 'grid-cols-2' : 'grid-cols-1'} gap-3\`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
                  <input type="text" value={formatCurrencyInput(manualForm.price)} onChange={e => setManualForm(f => ({ ...f, price: parseCurrencyInput(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                {manualForm.type === 'Barang' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                    <input type="number" min="1" value={manualForm.qty} onChange={e => setManualForm(f => ({ ...f, qty: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  </div>
                )}
              </div>
              {manualForm.price && manualForm.qty && (
                <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{formatRupiah((parseFloat(manualForm.price) || 0) * (parseInt(manualForm.qty) || 0))}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end pt-2 border-t">
                <button type="button" onClick={() => setManualOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Tambahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}\`;

const newModal = \`      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Input Item Manual (Bisa Banyak)</h2>
              <button onClick={() => setManualOpen(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {manualError && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{manualError}</div>}
              
              <div className="space-y-4">
                {manualForm.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-xl bg-gray-50/50 relative">
                    {manualForm.length > 1 && (
                      <button onClick={() => removeManualRow(item.id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full hover:bg-red-200 border border-white">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nama Item {index + 1}</label>
                        <input value={item.name} onChange={e => updateManualRow(item.id, 'name', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Nama barang / jasa" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Jenis</label>
                        <select value={item.type} onChange={e => updateManualRow(item.id, 'type', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                          <option value="Jasa">Jasa</option>
                          <option value="Barang">Barang</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                        <input type="text" value={formatCurrencyInput(item.price)} onChange={e => updateManualRow(item.id, 'price', parseCurrencyInput(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                        <input type="number" min="1" disabled={item.type === 'Jasa'} value={item.type === 'Jasa' ? '1' : item.qty} onChange={e => updateManualRow(item.id, 'qty', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-gray-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button onClick={addManualRow} className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                <Plus className="h-4 w-4" /> Tambah Baris Input
              </button>
              
            </div>

            <div className="flex gap-3 justify-between items-center p-5 border-t bg-gray-50 rounded-b-xl">
              <div className="text-sm">
                <span className="text-gray-500">Total Subtotal: </span>
                <span className="font-bold text-gray-900">
                  {formatRupiah(manualForm.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.type === 'Jasa' ? 1 : parseInt(item.qty) || 0)), 0))}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setManualOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 border rounded-lg hover:bg-gray-100 bg-white">Batal</button>
                <button onClick={addManual} className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90">Tambahkan Semua</button>
              </div>
            </div>
          </div>
        </div>
      )}\`;

c = c.replace(oldModal, newModal);

fs.writeFileSync('src/features/cashier/Cashier.tsx', c);
