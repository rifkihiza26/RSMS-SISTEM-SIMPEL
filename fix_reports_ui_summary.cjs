const fs = require('fs');
let code = fs.readFileSync('src/features/reports/Reports.tsx', 'utf-8');

// Header PDF Tabel "Untung" -> "Untung Parts"
code = code.replace(/<th class="right">Untung<\/th>/g, '<th class="right">Untung Parts</th>');
// Header UI Tabel "Untung" -> "Untung Parts"
code = code.replace(/<th className="px-4 py-2 text-right font-medium text-gray-600">Untung<\/th>/g, '<th className="px-4 py-2 text-right font-medium text-gray-600">Untung Parts</th>');

// Tambahkan summary bagi hasil di bawah table
const oldTableEnd = `                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}`;

const newTableEnd = `                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-blue-50 border-t border-blue-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-4">
                    <div className="bg-white px-3 py-2 rounded-lg border shadow-sm">
                      <p className="text-xs text-gray-500 font-medium">Total Jasa Servis</p>
                      <p className="text-lg font-bold text-gray-900">{formatRupiah(mech.totalJasa)}</p>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border shadow-sm">
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">Hak Mekanik (50%)</p>
                      <p className="text-lg font-bold text-green-700">{formatRupiah(mech.totalJasa * 0.5)}</p>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg border shadow-sm">
                      <p className="text-xs text-blue-600 font-medium">Hak Bengkel (50%)</p>
                      <p className="text-lg font-bold text-blue-700">{formatRupiah(mech.totalJasa * 0.5)}</p>
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border shadow-sm min-w-[150px] text-right">
                    <p className="text-xs text-gray-500 font-medium">Total Untung Parts (Bengkel)</p>
                    <p className="text-lg font-bold text-gray-900">{formatRupiah(mech.totalUntungParts)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}`;

code = code.replace(oldTableEnd, newTableEnd);
fs.writeFileSync('src/features/reports/Reports.tsx', code);
