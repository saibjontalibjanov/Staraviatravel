import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import DatePicker from './DatePicker'

// Airport autocomplete dropdown component
const AirportDropdown = ({ value, onChange, placeholder, label, excludeCode }) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [allAirports, setAllAirports] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Fetch airports from Strapi backend (which proxies the IATA API)
  useEffect(() => {
    const cached = sessionStorage.getItem('iata_airports')
    if (cached) {
      setAllAirports(JSON.parse(cached))
      return
    }

    setLoading(true)
    fetch('http://localhost:1337/api/airports')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          sessionStorage.setItem('iata_airports', JSON.stringify(data))
          setAllAirports(data)
        }
      })
      .catch(err => console.error('Failed to fetch airports:', err))
      .finally(() => setLoading(false))
  }, [])

  // Sync external value changes (e.g. swap)
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Filter airports based on query
  const filterAirports = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return allAirports
      .filter(a => {
        if (excludeCode && a.code === excludeCode) return false
        return (
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q)
        )
      })
      .slice(0, 8)
  }, [allAirports, excludeCode])

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    const filtered = filterAirports(val)
    setSuggestions(filtered)
    setShowDropdown(filtered.length > 0)
  }

  const handleSelect = (airport) => {
    const display = `${airport.city} (${airport.code})`
    setQuery(display)
    onChange(display)
    setShowDropdown(false)
  }

  const handleFocus = () => {
    if (query.length >= 2) {
      const filtered = filterAirports(query)
      setSuggestions(filtered)
      setShowDropdown(filtered.length > 0)
    }
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => setShowDropdown(false), 200)
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0 relative">
      <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">{label}</label>
      <input
        ref={inputRef}
        required
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="text-ink font-semibold text-sm bg-transparent outline-none placeholder:text-gray-400 w-full"
      />
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[100] max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Loading airports...</div>
          ) : (
            suggestions.map((airport, idx) => (
              <div
                key={`${airport.code}-${idx}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(airport)}
                className="px-4 py-2.5 hover:bg-gold/5 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-ink">{airport.city}</span>
                    <span className="text-xs text-gray-400 ml-2">{airport.country}</span>
                  </div>
                  <span className="text-xs font-bold text-gold bg-gold/10 px-2 py-0.5 rounded">{airport.code}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{airport.name}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const SearchForm = () => {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState('one-way')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [cabin, setCabin] = useState('Business')
  const [showPaxDropdown, setShowPaxDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const paxRef = useRef(null)
  const formRef = useRef(null)

  const today = new Date().toISOString().split('T')[0]

  // Get IATA code from selected value to exclude from the other dropdown
  const getCode = (val) => {
    const match = val.match(/\(([^)]+)\)/)
    return match ? match[1] : ''
  }

  useEffect(() => {
    if (showPaxDropdown && formRef.current) {
      const rect = formRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      })
    }
  }, [showPaxDropdown])

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
      departureDate,
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
      <form onSubmit={handleSubmit} ref={formRef}>
        <div className="flex flex-col lg:flex-row items-stretch bg-white rounded-lg shadow-2xl">
          {/* From */}
          <AirportDropdown
            value={from}
            onChange={setFrom}
            placeholder="City or Airport"
            label="From..."
            excludeCode={getCode(to)}
          />

          {/* Swap button */}
          <button
            type="button"
            onClick={swapCities}
            className="hidden lg:flex items-center justify-center w-8 bg-white hover:bg-gray-50 transition-colors border-r border-gray-200 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </button>

          {/* To */}
          <AirportDropdown
            value={to}
            onChange={setTo}
            placeholder="City or Airport"
            label="To..."
            excludeCode={getCode(from)}
          />

          {/* Departure */}
          <DatePicker
            value={departureDate}
            onChange={setDepartureDate}
            minDate={today}
            label="Departure Date"
            placeholder="Select date"
          />

          {/* Return Date (hidden for one-way) */}
          {tripType === 'round-trip' && (
            <DatePicker
              value={returnDate}
              onChange={setReturnDate}
              minDate={departureDate || today}
              label="Return Date"
              placeholder="Select date"
            />
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

      {/* Passengers/Cabin Dropdown */}
      {showPaxDropdown && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPaxDropdown(false)}></div>
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left"
            style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px`, width: `${dropdownPos.width}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Passengers */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-ink">Passengers</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(-1) }}
                  className="w-7 h-7 rounded-full border border-gray-300 text-ink font-bold hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                >
                  −
                </button>
                <span className="text-sm font-bold text-ink w-4 text-center">{passengers}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(1) }}
                  className="w-7 h-7 rounded-full border border-gray-300 text-ink font-bold hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Class */}
            <div>
              <p className="text-sm font-medium text-ink mb-2">Class</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Economy', value: 'Economy' },
                  { label: 'Premium Economy', value: 'Premium Economy' },
                  { label: 'Business', value: 'Business' },
                  { label: 'First class', value: 'First' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCabinChange(item.value) }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      cabin === item.value
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-gray-200 text-gray-600 hover:border-gold hover:text-gold'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

export default SearchForm
