const fs = require('fs');
const content = fs.readFileSync('src/features/transactions/Transactions.tsx', 'utf-8');

const replacement = `
              <div id="reprint-receipt" className="hidden">
                {(() => {
                  const isBesar = (detailTrx.notes || '').includes('[BESAR]');
                  const dateStr = new Date(detailTrx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                  const timeStr = new Date(detailTrx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                  
                  // Extract Mechanic and Motor from notes for A5
                  let mechanicName = '-';
                  let motorType = '';
                  if (detailTrx.notes) {
                    const parts = detailTrx.notes.split(' | ');
                    for (const p of parts) {
                      if (p.includes('Mekanik:')) mechanicName = p.split(': ')[1] || '-';
                      if (p.includes('Motor:')) motorType = p.split(': ')[1] || '';
                    }
                  }

                  if (isBesar) {
                    return (
                      <div style={{background:'white', padding:'20px', maxWidth:'148mm', minWidth:'140mm', fontFamily:'Arial, sans-serif', fontSize:'12px', color:'black'}}>
                        <div style={{display:'flex', alignItems:'center', borderBottom:'3px solid #000', paddingBottom:'10px', marginBottom:'10px', gap:'14px'}}>
                          <img src="/logo-struk.jpg" alt="Logo" style={{width:'60px', height:'60px', objectFit:'contain'}} />
                          <div>
                            <div style={{fontWeight:'bold', fontSize:'16px', textTransform:'uppercase'}}>RAKYAT SINTING MATIC SHOP</div>
                            <div style={{fontSize:'10px', color:'#444', marginTop:'3px', lineHeight:'1.6'}}>Jln. Pejaten Raya RT.01/RW.07 No. 3, Kel. Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan 12510</div>
                            <div style={{fontSize:'10px', color:'#444'}}>WA / Telp: 0813-8760-7676</div>
                          </div>
                        </div>

                        <div style={{textAlign:'center', margin:'8px 0 12px'}}>
                          <div style={{fontWeight:'bold', fontSize:'15px', letterSpacing:'2px', textTransform:'uppercase', border:'2px solid #000', display:'inline-block', padding:'3px 20px'}}>NOTA SERVIS BESAR</div>
                        </div>

                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', marginBottom:'12px', fontSize:'12px'}}>
                          <div><span style={{fontWeight:'bold'}}>No. Nota:</span> {detailTrx.transaction_number}</div>
                          <div><span style={{fontWeight:'bold'}}>Tanggal:</span> {dateStr}</div>
                          <div><span style={{fontWeight:'bold'}}>Jam:</span> {timeStr}</div>
                          <div><span style={{fontWeight:'bold'}}>Mekanik:</span> {mechanicName}</div>
                          {motorType && <div style={{gridColumn:'span 2'}}><span style={{fontWeight:'bold'}}>Jenis Motor / No. Polisi:</span> {motorType}</div>}
                        </div>

                        <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'10px', fontSize:'12px'}}>
                          <thead>
                            <tr style={{background:'#000', color:'#fff'}}>
                              <th style={{padding:'5px 8px', textAlign:'left', width:'5%'}}>No</th>
                              <th style={{padding:'5px 8px', textAlign:'left'}}>Nama Item / Jasa</th>
                              <th style={{padding:'5px 8px', textAlign:'center', width:'10%'}}>Jenis</th>
                              <th style={{padding:'5px 8px', textAlign:'center', width:'8%'}}>Qty</th>
                              <th style={{padding:'5px 8px', textAlign:'right', width:'18%'}}>Harga Satuan</th>
                              <th style={{padding:'5px 8px', textAlign:'right', width:'18%'}}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailItems.map((i: any, idx: number) => (
                              <tr key={i.id} style={{borderBottom:'1px solid #ccc', background: idx % 2 === 0 ? '#f9f9f9' : '#fff'}}>
                                <td style={{padding:'5px 8px'}}>{idx + 1}</td>
                                <td style={{padding:'5px 8px', fontWeight:'bold'}}>{i.item_name}</td>
                                <td style={{padding:'5px 8px', textAlign:'center', fontSize:'10px'}}>{i.item_type}</td>
                                <td style={{padding:'5px 8px', textAlign:'center'}}>{i.quantity}</td>
                                <td style={{padding:'5px 8px', textAlign:'right'}}>{formatRupiah(i.unit_price)}</td>
                                <td style={{padding:'5px 8px', textAlign:'right', fontWeight:'bold'}}>{formatRupiah(i.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'12px'}}>
                          <div style={{width:'220px', fontSize:'12px'}}>
                            <div style={{display:'flex', justifyContent:'space-between', padding:'3px 0'}}><span>Subtotal:</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                            {detailTrx.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', padding:'3px 0', color:'#c00'}}><span>Diskon:</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                            <div style={{display:'flex', justifyContent:'space-between', padding:'5px 0', borderTop:'2px solid #000', fontWeight:'bold', fontSize:'14px'}}><span>TOTAL:</span><span>{formatRupiah(detailTrx.total)}</span></div>
                            <div style={{display:'flex', justifyContent:'space-between', padding:'3px 0'}}><span>Metode:</span><span style={{fontWeight:'bold'}}>{detailTrx.payment_method}</span></div>
                            {detailTrx.payment_method === 'CASH' && <>
                              <div style={{display:'flex', justifyContent:'space-between', padding:'3px 0'}}><span>Dibayar:</span><span>{formatRupiah(detailTrx.paid_amount)}</span></div>
                              <div style={{display:'flex', justifyContent:'space-between', padding:'3px 0'}}><span>Kembalian:</span><span style={{fontWeight:'bold'}}>{formatRupiah(detailTrx.change_amount)}</span></div>
                            </>}
                          </div>
                        </div>

                        <div style={{display:'flex', justifyContent:'space-between', marginTop:'30px', textAlign:'center'}}>
                          <div style={{width:'200px'}}>
                            <div style={{marginBottom:'60px'}}>Hormat Kami,</div>
                            <div style={{borderBottom:'1px solid #000'}}></div>
                            <div style={{marginTop:'5px', fontSize:'10px', color:'#666'}}>Rakyat Sinting Matic Shop</div>
                          </div>
                          <div style={{width:'200px'}}>
                            <div style={{marginBottom:'60px'}}>Pelanggan,</div>
                            <div style={{borderBottom:'1px solid #000'}}></div>
                            <div style={{marginTop:'5px', fontSize:'10px', color:'#666'}}>Tanda Tangan / Nama Terang</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Default Nota Kecil
                  return (
                    <div style={{background:'white', padding:'4px', maxWidth:'58mm', fontFamily:'monospace', fontSize:'12px', color:'black'}}>
                      <div style={{textAlign:'center'}}>
                        <img src="/logo-struk.jpg" alt="Logo" style={{width:'140px', height:'auto', objectFit:'contain', margin:'0 auto 6px', display:'block'}} />
                        <div style={{fontWeight:'bold', fontSize:'13px'}}>RAKYAT SINTING MATIC SHOP</div>
                        <div style={{fontSize:'10px', marginTop:'3px', lineHeight:'1.5'}}>Jln. Pejaten Raya RT.01/RW.07 No. 3, Kel. Pejaten Barat, Kec. Pasar Minggu, Jakarta Selatan 12510</div>
                        <div style={{fontSize:'10px'}}>WA / Telp: 0813-8760-7676</div>
                        <div style={{fontSize:'11px', fontWeight:'bold', marginTop:'4px', letterSpacing:'1px'}}>— NOTA KECIL —</div>
                      </div>
                      <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span style={{fontWeight:'bold'}}>No. Transaksi:</span><span>{detailTrx.transaction_number}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Tanggal:</span><span>{dateStr}</span></div>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Jam:</span><span>{timeStr}</span></div>
                      {detailTrx.notes && detailTrx.notes.split(' | ').map((n: string, i: number) => {
                         const [k, v] = n.split(': ')
                         if (k === '[BESAR]' || k === '[KECIL]') return null
                         return k && v ? <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>{k.replace(/^\[.*?\]\s*/, '')}:</span><span style={{fontWeight:'bold'}}>{v}</span></div> : null
                      })}
                      <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

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

                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Subtotal</span><span>{formatRupiah(detailTrx.subtotal)}</span></div>
                      {detailTrx.discount > 0 && <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Diskon</span><span>-{formatRupiah(detailTrx.discount)}</span></div>}
                      <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px', fontWeight:'bold'}}><span>TOTAL</span><span>{formatRupiah(detailTrx.total)}</span></div>
                      <hr style={{borderTop:'1px dashed #000', margin:'6px 0', borderBottom:'none'}} />

                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Metode Bayar</span><span style={{fontWeight:'bold'}}>{detailTrx.payment_method}</span></div>
                      {detailTrx.payment_method === 'CASH' && (
                        <div style={{width:'100%'}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Uang Diterima</span><span>{formatRupiah(detailTrx.paid_amount)}</span></div>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'3px'}}><span>Kembalian</span><span style={{fontWeight:'bold'}}>{formatRupiah(detailTrx.change_amount)}</span></div>
                        </div>
                      )}
                      <hr style={{borderTop:'1px solid #000', margin:'6px 0', borderBottom:'none'}} />

                      <div style={{textAlign:'center', marginTop:'12px', fontSize:'11px'}}>
                        <div>Terima kasih telah mempercayakan</div>
                        <div>kendaraan Anda kepada kami!</div>
                        <div style={{marginTop:'6px', fontWeight:'bold'}}>— Rakyat Sinting Matic Shop —</div>
                      </div>
                    </div>
                  );
                })()}
              </div>`;

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l.includes('<div id="reprint-receipt"'));
const endIdx = startIdx + 56; // we know it ends at 447, start is 391. 447 - 391 = 56

if (startIdx !== -1 && lines[endIdx].includes('</div>')) {
  lines.splice(startIdx, endIdx - startIdx + 1, replacement.trim());
  fs.writeFileSync('src/features/transactions/Transactions.tsx', lines.join('\n'));
  console.log("Replaced successfully!");
} else {
  console.log("Failed to find exact bounds.");
}
