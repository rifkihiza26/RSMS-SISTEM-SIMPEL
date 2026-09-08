import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Download sebuah elemen HTML sebagai file PDF
 * @param elementId - ID elemen HTML yang akan dikonversi
 * @param filename - Nama file PDF yang didownload (tanpa .pdf)
 */
export async function downloadPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) {
    alert('Elemen tidak ditemukan.')
    return
  }

  // Tampilkan element sementara jika hidden
  const wasHidden = element.style.display === 'none' || element.classList.contains('hidden')
  if (wasHidden) {
    element.classList.remove('hidden')
    element.style.opacity = '0'
    element.style.pointerEvents = 'none'
    element.style.position = 'fixed'
    element.style.top = '-9999px'
    element.style.left = '-9999px'
    element.style.zIndex = '-1'
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = canvas.width
    const imgHeight = canvas.height

    // A4 = 210 x 297 mm
    // Untuk struk thermal, pakai lebar 80mm
    const isReceipt = imgWidth < imgHeight * 0.7

    let pdfWidth: number
    let pdfHeight: number

    if (isReceipt) {
      // Struk thermal - lebar 80mm
      pdfWidth = 80
      pdfHeight = (imgHeight * pdfWidth) / imgWidth
    } else {
      // Laporan - A4
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
    pdf.save(`${filename}.pdf`)
  } finally {
    if (wasHidden) {
      element.classList.add('hidden')
      element.style.opacity = ''
      element.style.pointerEvents = ''
      element.style.position = ''
      element.style.top = ''
      element.style.left = ''
      element.style.zIndex = ''
    }
  }
}

/**
 * Share PDF via WhatsApp Web
 * Menggunakan wa.me link dengan pesan default
 */
export function shareViaWhatsApp(phone?: string, message?: string) {
  const msg = message ?? 'Halo, berikut struk transaksi dari Rakyat Sinting Matic Shop 🏍️'
  const url = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}
