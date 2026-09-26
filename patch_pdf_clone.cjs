const fs = require('fs')
let content = fs.readFileSync('src/lib/pdf.ts', 'utf8')

// Rewrite downloadPDF
content = content.replace(
  /export async function downloadPDF[\s\S]*?\} finally \{[\s\S]*?\}\n\}/,
  `export async function downloadPDF(elementId: string, filename: string): Promise<void> {
  const originalElement = document.getElementById(elementId)
  if (!originalElement) {
    alert('Elemen tidak ditemukan.')
    return
  }

  // Gunakan teknik clone node agar html2canvas bisa merender elemen dengan benar
  // tanpa harus mengubah style elemen asli yang mungkin merusak UI
  const clone = originalElement.cloneNode(true) as HTMLElement
  
  // Pastikan clone terlihat oleh html2canvas tapi tidak terlihat oleh user
  clone.classList.remove('hidden')
  clone.style.display = 'block'
  clone.style.position = 'absolute'
  clone.style.top = '-9999px' // Pindahkan keluar layar
  clone.style.left = '-9999px'
  document.body.appendChild(clone)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = canvas.width
    const imgHeight = canvas.height

    const isReceipt = imgWidth < imgHeight * 0.7

    let pdfWidth: number
    let pdfHeight: number

    if (isReceipt) {
      pdfWidth = 80
      pdfHeight = (imgHeight * pdfWidth) / imgWidth
    } else {
      pdfWidth = 210
      pdfHeight = (imgHeight * pdfWidth) / imgWidth
      if (pdfHeight > 297) pdfHeight = 297
    }

    const pdf = new jsPDF({
      orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: isReceipt ? [pdfWidth, pdfHeight] : 'a4',
    })

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, isReceipt ? pdfHeight : (imgHeight * pdfWidth) / imgWidth)
    pdf.save(\`\${filename}.pdf\`)
  } finally {
    document.body.removeChild(clone)
  }
}`
)

fs.writeFileSync('src/lib/pdf.ts', content)
console.log('PDF clone patched!')
