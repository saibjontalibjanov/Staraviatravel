import { useState } from 'react'
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
        <div className="flex flex-col lg:flex-row items-stretch bg-white rounded-lg overflow-visible shadow-2xl">
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
          <div className="flex-1 flex flex-col justify-center px-4 py-2.5 border-b lg:border-b-0 lg:border-r border-gray-200 min-w-0 cursor-pointer relative">
            <label className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mb-0.5">Passengers / Cabin</label>
            <div 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPaxDropdown(!showPaxDropdown) }}
              className="text-ink font-semibold text-sm text-left"
            >
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

      {/* Passengers/Cabin Dropdown - rendered OUTSIDE the form to avoid overflow clipping */}
      {showPaxDropdown && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowPaxDropdown(false)}></div>
          <div className="relative z-[70] mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-full max-w-[280px] mx-auto lg:ml-auto lg:mr-[80px] text-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-ink">Passengers</span>
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(-1) }}
                  className="w-8 h-8 rounded-full border border-gray-300 text-ink font-bold hover:bg-gray-100 transition-colors flex items-center justify-center text-lg"
                >
                  −
                </button>
                <span className="text-base font-bold text-ink w-5 text-center">{passengers}</span>
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); changePax(1) }}
                  className="w-8 h-8 rounded-full border border-gray-300 text-ink font-bold hover:bg-gray-100 transition-colors flex items-center justify-center text-lg"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-ink mb-2">Class</p>
              <div className="grid grid-cols-2 gap-2">
                {['Economy', 'Premium Economy', 'Business', 'First Class'].map((cabinType) => (
                  <button 
                    key={cabinType}
                    type="button" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCabinChange(cabinType); setShowPaxDropdown(false) }}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                      cabin === cabinType
                        ? 'border-gold text-gold bg-gold/5'
                        : 'border-gray-200 text-gray-600 hover:border-gold hover:text-gold'
                    }`}
                  >
                    {cabinType}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SearchForm
