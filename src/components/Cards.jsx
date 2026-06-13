import React from 'react'
import HorDeals from './HotDeals.jsx'

const Cards = ({ deal, onClick }) => {
  return (
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
  )
}

export default Cards
