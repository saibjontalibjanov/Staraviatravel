import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    priceMax: 1200,
    stops: ['direct', '1stop'],
    airlines: ['flydubai', 'uzbekistan', 'emirates', 'turkish', 'airarabia'],
    times: ['morning', 'afternoon', 'evening']
  })

  const from = searchParams.get('from') || 'TAS'
  const to = searchParams.get('to') || 'DXB'
  const departDate = searchParams.get('departDate') || 'Jun 15, 2026'
  const passengers = searchParams.get('passengers') || '1'
  const cabin = searchParams.get('cabin') || 'Economy'

  const flights = [
    { id: 1, airline: 'Flydubai', code: 'FZ-1942', from: 'TAS', to: 'DXB', depart: '08:30', arrive: '11:15', duration: '3h 45m', stops: 'direct', price: 280, badge: 'Cheapest', time: 'morning' },
    { id: 2, airline: 'Uzbekistan Airways', code: 'HY-333', from: 'TAS', to: 'DXB', depart: '14:00', arrive: '16:30', duration: '3h 30m', stops: 'direct', price: 320, badge: 'Fastest', time: 'afternoon' },
    { id: 3, airline: 'Air Arabia', code: 'G9-505', from: 'TAS', to: 'DXB', depart: '07:00', arrive: '11:00', duration: '5h 00m', stops: '1stop', price: 260, time: 'morning' },
    { id: 4, airline: 'Emirates', code: 'EK-602', from: 'TAS', to: 'DXB', depart: '20:00', arrive: '22:50', duration: '3h 50m', stops: 'direct', price: 450, badge: 'Premium', time: 'evening' },
    { id: 5, airline: 'Turkish Airlines', code: 'TK-297', from: 'TAS', to: 'DXB', depart: '15:30', arrive: '21:30', duration: '6h 00m', stops: '1stop', price: 380, time: 'afternoon' },
    { id: 6, airline: 'Flydubai', code: 'FZ-1944', from: 'TAS', to: 'DXB', depart: '17:45', arrive: '20:40', duration: '3h 55m', stops: 'direct', price: 305, time: 'afternoon' },
  ]

  return (
    <div className="bg-surface text-ink font-sans antialiased selection:bg-gold selection:text-white">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-[1500px] flex items-center justify-between px-6 py-4 md:px-12 lg:px-8">
          <Link to="/" className="font-display text-2xl font-bold tracking-widest text-gold hover:text-gold-dark transition-colors">
            STARAVIA
          </Link>
          <div className="flex items-center gap-3">
            <a 
              href="https://wa.me/998901234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              Help
            </a>
            <Link 
              to="/" 
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-ink border border-gray-200 hover:border-gold transition-colors"
            >
              ←
            </Link>
          </div>
        </div>
      </header>

      {/* Search Summary Bar */}
      <section className="bg-white py-5 border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-[1500px] px-6 md:px-12 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-ink">{from}</h2>
              <p className="text-xs text-gray-500 font-medium">Departure</p>
            </div>
            <div className="flex flex-col items-center px-3 w-24">
              <span className="text-xs text-gold mb-1 font-semibold">Outbound</span>
              <div className="h-[1px] w-full bg-gray-300 relative flex items-center justify-center">
                <span className="text-base">✈️</span>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold font-display text-ink">{to}</h2>
              <p className="text-xs text-gray-500 font-medium">Arrival</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-gold">📅</span>
              <span>{departDate}</span>
            </div>
            <div className="w-[1px] h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gold">👤</span>
              <span>{passengers} Adult</span>
            </div>
            <div className="w-[1px] h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-gold">👑</span>
              <span>{cabin}</span>
            </div>
            <Link to="/" className="ml-1 text-gold font-semibold hover:text-gold-dark transition-colors">
              Modify
            </Link>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <main className="mx-auto max-w-[1500px] px-6 md:px-12 lg:px-8 mt-8 pb-20 grid lg:grid-cols-[300px_1fr] gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">Filters</h3>
            <button className="text-xs text-gold hover:underline font-medium">Reset</button>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-700 font-semibold">Price Range</span>
              <span className="text-gold font-bold">${filters.priceMax}</span>
            </div>
            <input 
              type="range" 
              min="250" 
              max="1200" 
              value={filters.priceMax}
              onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
              className="w-full h-1.5 rounded-full cursor-pointer"
            />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <h4 className="font-semibold text-ink mb-3">Stops</h4>
            <label className="flex items-center gap-3 mb-2.5 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-gold cursor-pointer"/>
              <span className="text-sm text-gray-600 group-hover:text-ink transition-colors">Non-stop</span>
              <span className="ml-auto text-xs text-gray-400 font-medium">from $280</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-gold cursor-pointer"/>
              <span className="text-sm text-gray-600 group-hover:text-ink transition-colors">1 Stop</span>
              <span className="ml-auto text-xs text-gray-400 font-medium">from $250</span>
            </label>
          </div>
        </aside>

        {/* Results Column */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 font-medium">
              Flights found: <span className="text-ink font-bold">{flights.length}</span>
            </p>
            <select className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-ink font-medium focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold cursor-pointer">
              <option value="cheapest">Cheapest first</option>
              <option value="fastest">Fastest first</option>
              <option value="best">Recommended</option>
            </select>
          </div>

          {/* Flight Cards */}
          <div className="space-y-4">
            {flights.map((flight) => (
              <div key={flight.id} className="card-light rounded-2xl p-5 sm:p-6 relative overflow-hidden cursor-pointer">
                {flight.badge && (
                  <div className={`absolute top-0 left-0 ${flight.badge === 'Cheapest' ? 'bg-gold' : flight.badge === 'Fastest' ? 'bg-green-500' : 'bg-purple-500'} text-white text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-br-xl`}>
                    {flight.badge}
                  </div>
                )}
                <div className="flex flex-col md:flex-row items-center justify-between gap-5 mt-2">
                  <div className="flex items-center gap-3 w-full md:w-auto min-w-[160px]">
                    <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 font-bold text-blue-600 text-sm">
                      {flight.airline.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-sm">{flight.airline}</h4>
                      <p className="text-xs text-gray-400">{flight.code}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-4 w-full">
                    <div className="text-right">
                      <h3 className="text-2xl font-bold font-display text-ink">{flight.depart}</h3>
                      <p className="text-xs text-gray-500 font-medium">{flight.from}</p>
                    </div>
                    <div className="flex flex-col items-center px-2 flex-1 max-w-[140px]">
                      <span className="text-xs text-gray-400 mb-1">{flight.duration}</span>
                      <div className="h-[2px] w-full bg-gray-200 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm">✈️</div>
                      </div>
                      <span className={`text-[10px] mt-1 font-bold tracking-wide uppercase ${flight.stops === 'direct' ? 'text-gold' : 'text-orange-500'}`}>
                        {flight.stops === 'direct' ? 'Non-stop' : '1 Stop'}
                      </span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold font-display text-ink">{flight.arrive}</h3>
                      <p className="text-xs text-gray-500 font-medium">{flight.to}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:items-end gap-2 pl-0 md:pl-5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs text-gray-400">per person</p>
                      <p className="text-3xl font-bold text-gold">${flight.price}</p>
                    </div>
                    <button className="bg-ink text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gold transition-colors text-sm shadow-sm whitespace-nowrap">
                      Select
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium">✓ Cancellable</span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">✓ Baggage: 23 kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SearchResults
