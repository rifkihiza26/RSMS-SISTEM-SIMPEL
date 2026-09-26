const fs = require('fs')

let content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf8')

// Kita akan me-replace blok `<div className="hidden">` beserta isinya `id="reprint-receipt"`.
const startIdx = content.indexOf('<div className="hidden">')
const endIdx = content.indexOf('</div>\n            </div>\n          </div>\n        </div>\n      )}\n    </div>')

const newHtml = `<div className="hidden">
              <div id="reprint-receipt" style={{background:'white', padding:'16px', maxWidth:'320px', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
                {/* Header */}
                <div style={{textAlign:'center'}}>
                  <img src="/logo.png" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
                  <div style={{fontWeight:'bold', fontSize:'13px'}}>RAKYAT SINTING MATIC SHOP</div>
                  <div style={{fontSize:'10px', marginTop:'3px', lineHeight:'1.5'}}>Jln. Pejaten Raya RT.01/RW.07 No. 3, Kel. Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan 12510</div>
                  <div style={{fontSize:'10px'}}>WA / Telp: 0813-8760-7676</div>
                </div>
                <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Transaction Info */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span style={{fontWeight:'bold'}}>No. Transaksi:</span><span>{detailTrx.transaction_number}</span></div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Tanggal:</span><span>{new Date(detailTrx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Jam:</span><span>{new Date(detailTrx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
                {detailTrx.notes && detailTrx.notes.split(' | ').map((n: string, i: number) => {
                   const [k, v] = n.split(': ')
                   return k && v ? <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>{k}:</span><span style={{fontWeight:'bold'}}>{v}</span></div> : null
                })}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Items */}
                <div style={{fontWeight:'bold', fontSize:'10px', marginBottom:'4px'}}>ITEM PEMBELIAN</div>
                {detailItems.map((i: any) => (
                  <div key={i.id} style={{marginBottom:'5px'}}>
                    <div style={{fontWeight:'bold', fontSize:'11px', marginBottom:'2px'}}>{i.item_name}</div>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:'11px'}}>{i.quantity} × {formatRupiah(i.unit_price)}</span>
                      <span style={{fontSize:'11px', fontWeight:'bold'}}>{formatRupiah(i.subtotal)}</span>
                    </div>
                  </div>
                ))}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Totals */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                {detailTrx.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px', fontWeight:'bold'}}><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                {/* Payment */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Metode Bayar</span><span style={{fontWeight:'bold'}}>{detailTrx.payment_method}</span></div>
                {detailTrx.payment_method === 'CASH' && (
                  <div style={{width:'100%'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Uang Diterima</span><span>{formatRupiah(detailTrx.paid_amount)}</span></div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Kembalian</span><span style={{fontWeight:'bold'}}>{formatRupiah(detailTrx.change_amount)}</span></div>
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
            </div>
`

// Also fix the PDF button. We must ensure the element 'reprint-receipt' is not restricted by its parent!
// Oh wait, `reprint-receipt` is INSIDE `<div className="hidden">`
// `downloadPDF` will remove `hidden` from `reprint-receipt`, but its parent is STILL hidden!
// So let's remove `<div className="hidden">` entirely and just put `className="hidden"` on `reprint-receipt` directly!
const fixedHtml = newHtml.replace('<div className="hidden">\n              <div id="reprint-receipt" style=', '<div id="reprint-receipt" className="hidden" style=').replace('</div>\n            </div>\n', '</div>\n')

content = content.substring(0, startIdx) + fixedHtml + content.substring(endIdx)

// One more fix: Make sure `reprint-receipt` is correctly closed
fs.writeFileSync('src/features/transactions/Transactions.tsx', content)
console.log('Fixed!')
