import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// ─── Month Picker ─────────────────────────────────────────────
interface MonthPickerProps {
  value: string // 'YYYY-MM'
  onChange: (val: string) => void
}
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => parseInt(value.split('-')[0]))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedYear = parseInt(value.split('-')[0])
  const selectedMonth = parseInt(value.split('-')[1]) - 1

  const label = `${MONTHS_ID[selectedMonth]} ${selectedYear}`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setYear(selectedYear) }}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[180px]"
      >
        <Calendar className="w-4 h-4 text-blue-500" />
        <span className="flex-1 text-left">{label}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-72">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setYear(y => y - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-bold text-gray-900 text-base">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_ID.map((m, idx) => {
              const isSelected = year === selectedYear && idx === selectedMonth
              const isCurrentMonth = year === new Date().getFullYear() && idx === new Date().getMonth()
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChange(`${year}-${String(idx + 1).padStart(2, '0')}`)
                    setOpen(false)
                  }}
                  className={`py-2 px-1 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isCurrentMonth
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Day Picker ────────────────────────────────────────────────
interface DayPickerProps {
  value: string // 'YYYY-MM-DD'
  onChange: (val: string) => void
  label?: string
}
export function DayPicker({ value, onChange, label }: DayPickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = value ? new Date(value + 'T12:00:00') : new Date()
  const [viewYear, setViewYear] = useState(parsed.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedDate = value || ''
  const displayLabel = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Pilih Tanggal'

  // Build calendar days
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open)
          if (value) {
            const d = new Date(value + 'T12:00:00')
            setViewYear(d.getFullYear())
            setViewMonth(d.getMonth())
          }
        }}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[200px]"
      >
        <Calendar className="w-4 h-4 text-blue-500" />
        <span className="flex-1 text-left">
          {label && <span className="text-gray-400 mr-1">{label}:</span>}
          {displayLabel}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-72">
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="font-bold text-gray-900 text-sm">
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = dateStr === selectedDate
              const isToday = dateStr === today
              return (
                <button
                  key={dateStr}
                  onClick={() => { onChange(dateStr); setOpen(false) }}
                  className={`w-full aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isToday
                      ? 'bg-blue-50 text-blue-700 border border-blue-300'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => { onChange(today); setOpen(false) }}
              className="w-full text-center text-sm text-blue-600 font-semibold hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
