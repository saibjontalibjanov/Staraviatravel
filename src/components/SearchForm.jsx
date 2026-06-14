import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

const SearchForm = () => {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState('one-way')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departDate, setDepartDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [cabin, setCabin] = useState('Business')
  const [showPaxDropdown, setShowPaxDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const paxRef = useRef(null)

  useEffect(() => {
    if (showPaxDropdown && paxRef.current) {
      const rect = paxRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      })
    }
  }, [showPaxDropdown])

  const airports = [
    'Toshkent (TAS)',
    "Farg'ona (FEG)",
    'Samarqand (SKD)',
    'Istanbul (IST)',
    'Dubay (DXB)',
    'New York (JFK)',
    'London (LHR)',
    'Paris (CDG)',
    'Bangkok (BKK)',
    'Kuala Lumpur (KUL)'
  ]

  const swapCities = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
  }

  const changePax = (delta) => {
    const newValue = passengers + delta
    if (newValue >= 1 && newValue <= 9) {
      setPassengers(newValue)
    }
  }

  const handleCabinChange = (newCabin) => {
    setCabin(newCabin)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const searchParams = new URLSearchParams({
      from,
      to,
      departDate,
      ...(tripType === 'round-trip' && { returnDate }),
      passengers,
      cabin
    })
    navigate(`/search-results?${searchParams.toString()}`)
  }

  return (
    <div className="mt-5 w-full max-w-4xl">
      {/* Trip type toggles */}
      <div className="flex items-center gap-1 mb-3 justify-start">
        <button
          type="button"
          onClick={() => setTripType('round-trip')}
          className={`trip-type-btn px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tripType === 'round-trip'
              ? 'text-white border-b-2 border-gold font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Round-Trip
        </button>
        <button
          type="button"
          onClick={() => setTripType('one-way')}
          className={`trip-type-btn px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            tripType === 'one-way'
              ? 'text-white border-b-2 border-gold font-semibold'
              : 'text-white/60 hover:text-white'
          }`}
        >
          One-Way
        </button>
      </div>

      {/* Main search form */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row items-stretch bg-white rounded-lg shadow-2xl">
          {/* From */}
          <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0">
            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">From...</label>
            <input
              list="airports-from"
              required
              autoComplete="off"
              placeholder="Toshkent (TAS)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="text-ink font-semibold text-sm bg-transparent outline-none placeholder:text-gray-400 w-full"
            />
            <datalist id="airports-from">
              {airports.map((airport, idx) => (
                <option key={idx} value={airport} />
              ))}
            </datalist>
          </div>

          {/* Swap button */}
          <button
            type="button"
            onClick={swapCities}
            className="hidden lg:flex items-center justify-center w-8 bg-white hover:bg-gray-50 transition-colors border-r border-gray-200 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </button>

          {/* To */}
          <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0">
            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">To...</label>
            <input
              list="airports-to"
              required
              autoComplete="off"
              placeholder="Istanbul (IST)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-ink font-semibold text-sm bg-transparent outline-none placeholder:text-gray-400 w-full"
            />
            <datalist id="airports-to">
              {airports.map((airport, idx) => (
                <option key={idx} value={airport} />
              ))}
            </datalist>
          </div>

          {/* Departure */}
          <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0">
            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Departure Date</label>
            <input
              required
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              placeholder="Select Date"
              className="text-ink font-semibold text-sm bg-transparent outline-none placeholder:text-gray-400 w-full cursor-pointer"
            />
          </div>

          {/* Return Date (hidden for one-way) */}
          {tripType === 'round-trip' && (
            <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0">
              <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Return Date</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                placeholder="Select Date"
                className="text-ink font-semibold text-sm bg-transparent outline-none placeholder:text-gray-400 w-full cursor-pointer"
              />
            </div>
          )}

          {/* Passengers / Cabin */}
          <div ref={paxRef} className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0 cursor-pointer">
            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Passengers / Cabin</label>
            <div
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPaxDropdown(!showPaxDropdown) }}
              className="text-ink font-semibold text-sm text-left">
              {passengers} | {cabin}
            </div>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="bg-gold hover:bg-gold-dark transition-colors text-white font-bold text-xs uppercase tracking-widest px-6 py-3 lg:py-0 flex items-center justify-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Search
          </button>
        </div>
      </form>

      {/* Passengers/Cabin Dropdown - rendered via PORTAL to body to escape ALL overflow:hidden */}
      {showPaxDropdown && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPaxDropdown(false)}></div>
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 w-[280px] text-left -translate-x-1/2"
            style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-1 pb-3 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Passengers / Cabin</p>
              <p className="text-ink font-bold text-lg mt-1">{passengers} | {cabin}</p>
            </div>

            {/* Passengers */}
            <div className="py-4 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">PASSENGERS</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(-1) }}
                  className="w-10 h-10 rounded border border-gray-300 text-ink font-bold hover:bg-gray-100 transition-colors flex items-center justify-center text-xl"
                >
                  −
                </button>
                <span className="text-xl font-bold text-ink w-8 text-center border border-gray-200 rounded py-1.5">{passengers}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(1) }}
                  className="w-10 h-10 rounded border border-gold bg-gold text-white font-bold hover:bg-gold-dark transition-colors flex items-center justify-center text-xl"
                >
                  +
                </button>
              </div>
            </div>

            {/* Cabin Class */}
            <div className="py-4">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">CABIN CLASS</p>
              <div className="space-y-2.5">
                {['Premium Economy', 'Business', 'First'].map((cabinType) => (
                  <label
                    key={cabinType}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCabinChange(cabinType) }}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      cabin === cabinType ? 'border-gold' : 'border-gray-300 group-hover:border-gold/50'
                    }`}>
                      {cabin === cabinType && (
                        <div className="w-3 h-3 rounded-full bg-gold"></div>
                      )}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${
                      cabin === cabinType ? 'text-ink font-semibold' : 'text-gray-600'
                    }`}>
                      {cabinType}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setShowPaxDropdown(false)}
              className="w-full mt-2 text-gold font-semibold text-sm uppercase tracking-wider hover:text-gold-dark transition-colors text-right pr-1 py-1"
            >
              DONE
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default SearchForm
