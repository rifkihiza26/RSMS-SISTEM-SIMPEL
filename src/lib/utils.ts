export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateTransactionNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `TRX-${y}${m}${d}-${rand}`
}

export function generateRestockNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `RST-${y}${m}${d}-${rand}`
}

export function generateExpenseNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
  return `EXP-${y}${m}${d}-${rand}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrencyInput(val: string | number): string {
  if (val === undefined || val === null) return ''
  const numberStr = String(val).replace(/\D/g, '')
  if (!numberStr) return ''
  return parseInt(numberStr, 10).toLocaleString('id-ID')
}

export function parseCurrencyInput(val: string): string {
  return val.replace(/\D/g, '')
}
