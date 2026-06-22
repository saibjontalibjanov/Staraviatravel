import React from 'react'

const Cards = ({ deal, handleDealClick }) => {
  return (
    <div
      onClick={() => handleDealClick(deal)}
      className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer snap-start"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={deal.image}
          alt={deal.destination || deal.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold`}>
          {deal.badge}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-bold text-ink mb-1">{deal.destination || deal.title}</h3>
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
  )
}

export default Cards
