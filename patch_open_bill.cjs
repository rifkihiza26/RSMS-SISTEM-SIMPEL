const fs = require('fs')

let c = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// 1. Tambahkan state untuk sync
const stateInjection = `  const [processing, setProcessing] = useState(false)
  
  async function saveOpenBill() {
    const session = activeSession
    if (!session || session.cart.length === 0) return alert('Keranjang kosong!')
    
    setProcessing(true)
    const cartJson = session.cart.map(i => ({
      ...i, stock_tracked: i.type === 'PRODUCT', quantity: i.qty, unit_price: i.price, subtotal: i.qty * i.price
    }))

    const { error } = await supabase.rpc('sync_open_bill', {
      p_tx_id: session.id,
      p_tx_number: session.trxNumber || 'TRX-OPEN-' + Math.floor(Math.random() * 10000),
      p_mechanic_id: selectedMechanicId || null,
      p_motor_type: motorType || '',
      p_new_cart: cartJson,
      p_created_by: user?.id
    })

    setProcessing(false)
    if (error) {
      alert('Gagal menyimpan bon: ' + error.message)
    } else {
      updateSession({ isSavedInDb: true })
      // Trigger refetch stock
      queryClient.invalidateQueries({ queryKey: ['cashier_products'] })
      alert('Bon berhasil disimpan & stok dibooking!')
    }
  }

  async function cancelOpenBill() {
    const session = activeSession
    if (!session) return
    
    if (confirm('Hapus tab ini dan kembalikan stok (jika sudah tersimpan)?')) {
      if (session.isSavedInDb) {
        setProcessing(true)
        await supabase.rpc('cancel_open_bill', { p_tx_id: session.id })
        setProcessing(false)
        queryClient.invalidateQueries({ queryKey: ['cashier_products'] })
      }
      removeSession(session.id)
    }
  }
`

c = c.replace('  const activeSession = sessions.find(s => s.id === activeSessionId)', '  const activeSession = sessions.find(s => s.id === activeSessionId)\n' + stateInjection)

// 2. Modifikasi completeTransaction
const completeTxRegex = /async function completeTransaction\(\) \{[\s\S]*?const \{ error \} = await supabase\.rpc\('process_transaction'[\s\S]*?p_items: items,\n    \}\)/

const newCompleteTx = `async function completeTransaction() {
    if (cart.length === 0) return updateSession({ txError: 'Keranjang masih kosong.' })
    if (paymentMethod === 'CASH' && paidAmount < total) return updateSession({ txError: 'Uang yang dibayarkan kurang dari total belanja.' })
    updateSession({ txError: '' }); setProcessing(true)
    
    const session = activeSession
    const trxNumber = session?.trxNumber || generateTransactionNumber()
    const paid = paymentMethod === 'CASH' ? paidAmount : total
    
    const cartJson = cart.map(i => ({
      item_type: i.type,
      product_id: i.product_id ?? null,
      service_id: i.service_id ?? null,
      item_name: i.name,
      sku: i.sku ?? null,
      quantity: i.qty,
      unit_price: i.price,
      subtotal: i.price * i.qty,
      stock_tracked: i.type === 'PRODUCT',
      is_service: i.is_service,
    }))

    // Wajib sync dulu agar status jadi OPEN dan ID terdaftar
    const { error: syncErr } = await supabase.rpc('sync_open_bill', {
      p_tx_id: session!.id, p_tx_number: trxNumber, p_mechanic_id: selectedMechanicId || null,
      p_motor_type: motorType || '', p_new_cart: cartJson, p_created_by: user?.id
    })

    if (syncErr) {
      setProcessing(false); return updateSession({ txError: 'Gagal sinkronisasi: ' + syncErr.message })
    }

    const mechanicName = mechanics.find(m => m.id === selectedMechanicId)?.name || ''
    const notes = [mechanicName ? \`Mekanik: \${mechanicName}\` : '', motorType ? \`Motor: \${motorType}\` : ''].filter(Boolean).join(' | ')

    // Lalu bayar (Pay)
    const { error } = await supabase.rpc('pay_open_bill', {
      p_tx_id: session!.id,
      p_subtotal: subtotal,
      p_discount: discount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paid,
      p_change_amount: paymentMethod === 'CASH' ? paid - total : 0,
      p_notes: notes,
      p_items: cartJson
    })`

c = c.replace(completeTxRegex, newCompleteTx)

// 3. Tambahkan tombol Simpan & Hapus di keranjang
const buttonsHtml = `
            {/* Open Bill Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={saveOpenBill} disabled={processing || cart.length === 0}
                className="w-full py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                 Simpan Bon (Booking)
              </button>
              <button onClick={cancelOpenBill} disabled={processing}
                className="w-full py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                 Batalkan / Hapus
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">`

c = c.replace(/<div className="mt-4 pt-4 border-t border-gray-100">/, buttonsHtml)

fs.writeFileSync('src/features/cashier/Cashier.tsx', c)
console.log('Injected Open Bill logic into old UI')
