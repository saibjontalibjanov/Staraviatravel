import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

const SearchResults = () => {
  const [searchParams] = useSearchParams()

  const from = searchParams.get('from') || 'Dubai'
  const to = searchParams.get('to') || 'New York'
  const fromCode = searchParams.get('from')?.match(/\(([^)]+)\)/)?.[1] || 'DXB'
  const toCode = searchParams.get('to')?.match(/\(([^)]+)\)/)?.[1] || 'JFK'
  const passengers = searchParams.get('passengers') || '1'
  const cabin = searchParams.get('cabin') || 'Business'
  const tripType = searchParams.get('returnDate') ? 'round-trip' : 'one-way'

  // Featured deal
  const featuredDeal = {
    oldPrice: 2789,
    price: 2789,
    perPerson: true
  }

  // Airline offers
  const airlineOffers = [
    {
      airline: 'EgyptAir',
      logo: null,
      logoText: 'EGYPTAIR',
      cabin: 'Business class',
      tripType: 'one way',
      price: 2858
    },
    {
      airline: 'Royal Air Maroc',
      logo: null,
      logoText: 'Royal Air Maroc',
      cabin: 'Business class',
      tripType: 'one way',
      price: 3065
    },
    {
      airline: 'ITA Airways',
      logo: null,
      logoText: 'ITA AIRWAYS',
      cabin: 'Business class',
      tripType: 'one way',
      price: 3188
    },
    {
      airline: 'Turkish Airlines',
      logo: null,
      logoText: 'Turkish Airlines',
      cabin: 'Business class',
      tripType: 'one way',
      price: 2950
    },
    {
      airline: 'Emirates',
      logo: null,
      logoText: 'Emirates',
      cabin: 'Business class',
      tripType: 'one way',
      price: 3420
    },
    {
      airline: 'Qatar Airways',
      logo: null,
      logoText: 'Qatar Airways',
      cabin: 'Business class',
      tripType: 'one way',
      price: 3275
    }
  ]

  const stats = [
    { value: '10+', label: 'YEARS IN BUSINESS' },
    { value: '97%', label: 'SATISFACTION RATE' },
    { value: '2M+', label: 'CLIENTS SERVED' },
    { value: '500+', label: 'LIVE AGENTS' }
  ]

  return (
    <div className="bg-white text-ink font-sans antialiased selection:bg-gold selection:text-white min-h-screen">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl font-bold tracking-widest text-gold hover:text-gold-dark transition-colors">
            STARAVIA
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-ink hover:text-gold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              New Search
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">

        {/* Featured Deal Card */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Route Info */}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-ink">{from.replace(/\s*\([^)]*\)/, '')}</h2>
                <span className="bg-gray-100 border border-gray-300 text-xs font-bold text-ink px-2 py-0.5 rounded">{fromCode}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-ink">{to.replace(/\s*\([^)]*\)/, '')}</h2>
                <span className="bg-gray-100 border border-gray-300 text-xs font-bold text-ink px-2 py-0.5 rounded">{toCode}</span>
              </div>
              <p className="text-sm text-gray-500">
                {cabin} | {tripType} | {passengers} Passenger{passengers > 1 ? 's' : ''}
              </p>
            </div>

            {/* Price Section */}
            <div className="flex items-center gap-6">
              <div>
                {/* Urgency Badge */}
                <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/30 text-gold-dark px-3 py-1 rounded-full text-xs font-bold mb-2">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                  Hurry! Limited Seats!
                </div>
                <div className="flex items-baseline gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Old Price:</p>
                    <p className="text-sm text-gray-400 line-through">${featuredDeal.oldPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-4xl font-bold text-ink">${featuredDeal.price.toLocaleString()}</span>
                    <span className="text-xs text-gray-500 align-top">*</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>per</p>
                    <p>person</p>
                  </div>
                </div>
              </div>

              {/* Official Retailer Badge */}
              <div className="hidden sm:flex items-center gap-4 pl-6 border-l border-gray-200">
                <div className="text-center">
                  <div className="border-2 border-ink px-2 py-1 mb-1">
                    <p className="text-[8px] font-bold text-ink leading-tight">OFFICIAL</p>
                    <p className="text-[8px] font-bold text-ink leading-tight">AIRLINES</p>
                    <p className="text-[8px] font-bold text-ink leading-tight">RETAILER</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lost Baggage Protection Banner */}
        <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-6 mb-8 text-center">
          <p className="text-sm font-bold text-ink">Lost Baggage Protection</p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 mb-10 py-6 border-t border-b border-gray-100">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-3xl md:text-4xl font-bold text-ink font-display">{stat.value}</span>
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase leading-tight max-w-[80px]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Airline Offer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {airlineOffers.map((offer, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-5 hover:border-gold/50 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Airline Name/Logo */}
              <div className="mb-4 h-10 flex items-center">
                <span className="text-lg font-bold text-ink">{offer.logoText}</span>
              </div>

              {/* Trip Details */}
              <p className="text-sm text-gray-500 mb-4">
                {offer.cabin} | {offer.tripType}
              </p>

              {/* Price + Arrow */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-ink">${offer.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 align-top">*</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-gray-400 mt-6 leading-relaxed">
          *Prices are per person, subject to availability and may change without notice. Additional taxes and fees may apply. Contact our travel agents for the most up-to-date pricing.
        </p>

      </main>

      {/* Floating Phone Button */}
      <a
        href="tel:+998901234567"
        className="phone-btn fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="Call Us"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
      </a>
    </div>
  )
}

export default SearchResults
