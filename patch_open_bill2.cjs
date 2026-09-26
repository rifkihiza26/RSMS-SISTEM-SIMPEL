const fs = require('fs');

let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8');

c = c.replace('txError: string\n}', 'txError: string\n  isSavedInDb?: boolean\n  trxNumber?: string\n}');

const activeSessionLine = 'const activeSession = sessions[activeTab] ?? sessions[0]';
const stateInjection = \`
  const [processing, setProcessing] = useState(false);

  const saveOpenBill = async () => {
    const session = activeSession;
    if (!session || session.cart.length === 0) return alert('Keranjang kosong!');
    
    setProcessing(true);
    const cartJson = session.cart.map(i => ({
      item_type: i.type, product_id: i.product_id ?? null, service_id: i.service_id ?? null,
      item_name: i.name, sku: i.sku ?? null, quantity: i.qty, unit_price: i.price, subtotal: i.qty * i.price,
      stock_tracked: i.type === 'PRODUCT', is_service: i.is_service
    }));

    const trxNumber = session.trxNumber || generateTransactionNumber();

    const { error } = await supabase.rpc('sync_open_bill', {
      p_tx_id: session.id,
      p_tx_number: trxNumber,
      p_mechanic_id: selectedMechanicId || null,
      p_motor_type: motorType || '',
      p_new_cart: cartJson,
      p_created_by: user?.id
    });

    setProcessing(false);
    if (error) {
      alert('Gagal menyimpan bon: ' + error.message);
    } else {
      updateSession({ isSavedInDb: true, trxNumber });
      queryClient.invalidateQueries({ queryKey: ['cashier_products'] });
      alert('Bon berhasil disimpan (Draft)! Stok otomatis terbooking.');
    }
  };

  const cancelOpenBill = async () => {
    const session = activeSession;
    if (!session) return;
    
    if (confirm('Batalkan transaksi ini? Stok (jika sudah tersimpan) akan dikembalikan.')) {
      if (session.isSavedInDb) {
        setProcessing(true);
        await supabase.rpc('cancel_open_bill', { p_tx_id: session.id });
        setProcessing(false);
        queryClient.invalidateQueries({ queryKey: ['cashier_products'] });
      }
      removeSession(session.id);
    }
  };
\`;

c = c.replace(activeSessionLine, activeSessionLine + '\\n' + stateInjection);

const completeTxRegex = /async function completeTransaction\\(\\) \\{[\\s\\S]*?const \\{ error \\} = await supabase\\.rpc\\('process_transaction'[\\s\\S]*?p_items: items,\\n    \\}\\)/;

const newCompleteTx = \`async function completeTransaction() {
    if (cart.length === 0) return updateSession({ txError: 'Keranjang masih kosong.' })
    if (paymentMethod === 'CASH' && paidAmount < total) return updateSession({ txError: 'Uang yang dibayarkan kurang dari total belanja.' })
    updateSession({ txError: '' }); setProcessing(true)
    
    const session = activeSession
    const trxNumber = session.trxNumber || generateTransactionNumber()
    const paid = paymentMethod === 'CASH' ? paidAmount : total
    
    const cartJson = cart.map(i => ({
      item_type: i.type, product_id: i.product_id ?? null, service_id: i.service_id ?? null,
      item_name: i.name, sku: i.sku ?? null, quantity: i.qty, unit_price: i.price, subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT', is_service: i.is_service,
    }))

    const { error: syncErr } = await supabase.rpc('sync_open_bill', {
      p_tx_id: session.id, p_tx_number: trxNumber, p_mechanic_id: selectedMechanicId || null,
      p_motor_type: motorType || '', p_new_cart: cartJson, p_created_by: user?.id
    })

    if (syncErr) {
      setProcessing(false); return updateSession({ txError: 'Gagal sinkronisasi: ' + syncErr.message })
    }

    const mechanicName = mechanics.find(m => m.id === selectedMechanicId)?.name || ''
    const notes = [mechanicName ? \\\`Mekanik: \${mechanicName}\\\` : '', motorType ? \\\`Motor: \${motorType}\\\` : ''].filter(Boolean).join(' | ')

    const { error } = await supabase.rpc('pay_open_bill', {
      p_tx_id: session.id,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paid,
      p_change_amount: paymentMethod === 'CASH' ? paid - total : 0,
      p_notes: notes,
      p_items: cartJson
    })\`;

c = c.replace(completeTxRegex, newCompleteTx);

const buttonsHtml = \`
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={saveOpenBill} disabled={processing || cart.length === 0}
                className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
                 Simpan (Draft)
              </button>
              <button onClick={cancelOpenBill} disabled={processing}
                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm transition-colors">
                 Batalkan
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">\`;

c = c.replace(/<div className="mt-4 pt-4 border-t border-gray-100">/, buttonsHtml);

fs.writeFileSync('src/features/cashier/Cashier.tsx', c);
