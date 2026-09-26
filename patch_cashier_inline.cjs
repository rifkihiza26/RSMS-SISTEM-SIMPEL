const fs = require('fs')

let content = fs.readFileSync('src/features/cashier/Cashier.tsx', 'utf8')

// Find start of hidden receipt
const startStr = '{/* Hidden receipt for print */}'
const startIdx = content.indexOf(startStr)
if (startIdx === -1) throw new Error('Start not found')

const endStr = '      </div>\n    )\n  }'
const endIdx = content.indexOf(endStr, startIdx)

const newHtml = `{/* Hidden receipt for print */}
        <div ref={receiptRef} id="receipt-pdf" className="hidden" style={{background:'white', padding:'16px', maxWidth:'320px', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
          {/* Header */}
          <div style={{textAlign:'center'}}>
            <img src="/logo.png" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
            <div style={{fontWeight:'bold', fontSize:'13px'}}>{SHOP_NAME}</div>
            <div style={{fontSize:'10px', marginTop:'3px', lineHeight:'1.5'}}>{SHOP_ADDRESS}</div>
            <div style={{fontSize:'10px'}}>WA / Telp: {SHOP_PHONE}</div>
          </div>
          <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

          {/* Transaction Info */}
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span style={{fontWeight:'bold'}}>No. Transaksi:</span><span>{completed.transaction_number}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Tanggal:</span><span>{dateStr}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Jam:</span><span>{timeStr}</span></div>
          {completed.motor_type && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Motor:</span><span style={{fontWeight:'bold'}}>{completed.motor_type}</span></div>}
          {completed.mechanic_name !== '-' && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Mekanik:</span><span style={{fontWeight:'bold'}}>{completed.mechanic_name}</span></div>}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

          {/* Items */}
          <div style={{fontWeight:'bold', fontSize:'10px', marginBottom:'4px'}}>ITEM PEMBELIAN</div>
          {completed.items.map(i => (
            <div key={i.id} style={{marginBottom:'5px'}}>
              <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'2px'}}>{i.name}</div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{fontSize:'11px'}}>{i.qty} × {formatRupiah(i.price)}</span>
                <span style={{fontSize:'11px', fontWeight:'bold'}}>{formatRupiah(i.price * i.qty)}</span>
              </div>
            </div>
          ))}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

          {/* Totals */}
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal</span><span>{formatRupiah(completed.subtotal)}</span></div>
          {completed.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon</span><span>-{formatRupiah(completed.discount)}</span></div>}
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px', fontWeight:'bold'}}><span>TOTAL</span><span>{formatRupiah(completed.total)}</span></div>
          <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

          {/* Payment */}
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Metode Bayar</span><span style={{fontWeight:'bold'}}>{completed.payment_method}</span></div>
          {completed.payment_method === 'CASH' && (
            <div style={{width:'100%'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Uang Diterima</span><span>{formatRupiah(completed.total + completed.change_amount)}</span></div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Kembalian</span><span style={{fontWeight:'bold'}}>{formatRupiah(completed.change_amount)}</span></div>
            </div>
          )}
          <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

          {/* Footer */}
          <div style={{textAlign:'center', marginTop:'12px', fontSize:'11px'}}>
            <div>Terima kasih telah mempercayakan</div>
            <div>kendaraan Anda kepada kami!</div>
            <div style={{marginTop:'6px', fontWeight:'bold'}}>— Rakyat Sinting Matic Shop —</div>
          </div>
        </div>
`

content = content.substring(0, startIdx) + newHtml + content.substring(endIdx)

// One more fix: In printReceipt, we don't need the CSS classes anymore because they are inline!
content = content.replace(
  /<style>[\s\S]*?<\/style>/,
  '<style>@media print { .no-print { display: none !important; } } body{font-family:monospace;font-size:12px;margin:0;padding:16px;width:320px;color:black;background:white}</style>'
)

fs.writeFileSync('src/features/cashier/Cashier.tsx', content)
console.log('Cashier inline patched!')
