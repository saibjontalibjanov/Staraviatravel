import { useState, useRef, useEffect } from 'react'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const DatePicker = ({ value, onChange, minDate, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00')
    if (minDate) return new Date(minDate + 'T00:00:00')
    return new Date()
  })
  const containerRef = useRef(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const min = minDate ? new Date(minDate + 'T00:00:00') : today

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update viewDate when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'))
    }
  }, [value])

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 6 : day - 1 // Monday = 0
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  const selectDate = (day) => {
    const selected = new Date(year, month, day)
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(formatted)
    setIsOpen(false)
  }

  const isDisabled = (day) => {
    const date = new Date(year, month, day)
    date.setHours(0, 0, 0, 0)
    return date < min
  }

  const isSelected = (day) => {
    if (!value) return false
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return formatted === value
  }

  const isToday = (day) => {
    const date = new Date(year, month, day)
    return date.toDateString() === new Date().toDateString()
  }

  const formatDisplay = (val) => {
    if (!val) return ''
    const d = new Date(val + 'T00:00:00')
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
  }

  // Can we go to previous month?
  const canGoPrev = new Date(year, month, 0) >= min

  // Build calendar grid
  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0 relative">
      <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <svg className="w-4 h-4 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span className={`text-sm font-semibold ${value ? 'text-ink' : 'text-gray-400'}`}>
          {value ? formatDisplay(value) : placeholder || 'Select date'}
        </span>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] p-4 w-[300px] animate-fadeIn">
          {/* Month/Year Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <span className="text-sm font-bold text-ink">{MONTHS[month]} {year}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => (
              <div key={idx} className="aspect-square flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    disabled={isDisabled(day)}
                    onClick={() => selectDate(day)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-all
                      ${isSelected(day)
                        ? 'bg-gold text-white font-bold shadow-md'
                        : isToday(day)
                          ? 'bg-gold/10 text-gold font-bold border border-gold/30'
                          : isDisabled(day)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-ink hover:bg-gold/10 hover:text-gold cursor-pointer'
                      }`}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(''); setIsOpen(false) }}
              className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date()
                const formatted = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
                if (new Date(formatted + 'T00:00:00') >= min) {
                  onChange(formatted)
                  setIsOpen(false)
                }
              }}
              className="text-xs font-semibold text-gold hover:text-gold-dark transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
