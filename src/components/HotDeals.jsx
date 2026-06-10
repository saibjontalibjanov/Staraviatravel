import { useState, useRef } from 'react'

const HotDeals = () => {
  const carouselRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const deals = [
    {
      destination: 'Istanbul',
      type: 'Business Class • Direct Flight',
      oldPrice: '$450',
      price: '$360',
      badge: '-20% OFF',
      badgeColor: 'bg-red-500',
      image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=600&q=80',
      from: 'TAS',
      to: 'IST'
    },
    {
      destination: 'Dubai',
      type: 'Business Class • Baggage Included',
      price: '$280',
      badge: 'POPULAR',
      badgeColor: 'bg-blue-500',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
      from: 'TAS',
      to: 'DXB'
    },
    {
      destination: 'New York',
      type: 'First Class • Meal Included',
      oldPrice: '$1050',
      price: '$890',
      badge: 'NEW ROUTE',
      badgeColor: 'bg-green-500',
      image: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=600&q=80',
      from: 'TAS',
      to: 'JFK'
    },
    {
      destination: 'London',
      type: 'Business Class • Premium Lounge',
      oldPrice: '$720',
      price: '$650',
      badge: 'LIMITED',
      badgeColor: 'bg-purple-500',
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      from: 'TAS',
      to: 'LHR'
    },
    {
      destination: 'Paris',
      type: 'Business Class • City Transfer',
      oldPrice: '$680',
      price: '$590',
      badge: 'HOT DEAL',
      badgeColor: 'bg-pink-500',
      image: '/pictures/hot-deals-pictures/Paris.jpg',
      from: 'TAS',
      to: 'CDG'
    },
    {
      destination: 'Bangkok',
      type: 'Business Class • Hotel Package',
      price: '$420',
      badge: 'BEST PRICE',
      badgeColor: 'bg-orange-500',
      image: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=600&q=80',
      from: 'TAS',
      to: 'BKK'
    }
  ]

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 296 // card width (280) + gap (16)
      const newIndex = direction === 'next' 
        ? Math.min(currentIndex + 1, deals.length - 1)
        : Math.max(currentIndex - 1, 0)
      
      carouselRef.current.scrollTo({
        left: newIndex * scrollAmount,
        behavior: 'smooth'
      })
      setCurrentIndex(newIndex)
    }
  }

  const handleDealClick = (deal) => {
    // Scroll to search form and populate it
    const searchForm = document.getElementById('flightForm')
    if (searchForm) {
      const fromInput = document.getElementById('from-input')
      const toInput = document.getElementById('to-input')
      if (fromInput) fromInput.value = `${deal.from}`
      if (toInput) toInput.value = `${deal.to}`
      searchForm.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <section id="chegirmalar" className="w-full bg-[#f0ebe1] px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-gold font-semibold tracking-wider uppercase text-sm">Special Offers</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mt-2">Hot Deals</h2>
          </div>
          {/* Carousel Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll('prev')}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('next')}
              disabled={currentIndex === deals.length - 1}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, index) => (
              <div
                key={index}
                onClick={() => handleDealClick(deal)}
                className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer snap-start"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.destination}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute top-3 right-3 ${deal.badgeColor} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                    {deal.badge}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold text-ink mb-1">{deal.destination}</h3>
                  <p className="text-sm text-ink/60 mb-4">{deal.type}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      {deal.oldPrice && (
                        <p className="text-xs text-ink/50 line-through">{deal.oldPrice}</p>
                      )}
                      {!deal.oldPrice && (
                        <p className="text-xs text-white select-none">.</p>
                      )}
                      <p className="text-2xl font-bold text-gold">{deal.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HotDeals
