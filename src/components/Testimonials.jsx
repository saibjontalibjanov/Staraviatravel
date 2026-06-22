import React from 'react'

const Testimonials = () => {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const testimonials = [
    { name: 'Aziza K.', location: 'Tashkent, Uzbekistan', text: 'Finding a ticket through the website was so easy. The agents found me the cheapest and most convenient flight. Thank you so much!', img: 1 },
    { name: 'Rustam B.', location: 'Samarkand, Uzbekistan', text: 'We bought tickets for a family holiday to Dubai. The prices were very affordable and the service quality was excellent.', img: 11 },
    { name: 'Malika O.', location: 'Bukhara, Uzbekistan', text: 'The support center works great. When my flight changed, they resolved the issue immediately.', img: 5 },
    { name: 'Dilshod M.', location: 'Tashkent, Uzbekistan', text: 'Excellent service! Booked my business class ticket to London at an amazing price. The concierge was very professional.', img: 12 },
    { name: 'Nilufar S.', location: 'Andijan, Uzbekistan', text: 'Best travel agency in Uzbekistan! They helped me with visa documents and found the perfect flight route.', img: 9 },
    { name: 'Sardor T.', location: 'Namangan, Uzbekistan', text: 'Very responsive customer service. I changed my flight dates twice and they handled everything smoothly without any hassle.', img: 14 },
  ]

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstChild?.offsetWidth || 350
      const scrollAmount = direction === 'next' ? cardWidth + 32 : -(cardWidth + 32)
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setTimeout(checkScroll, 400)
    }
  }

  return (
    <section id="fikrlar" className="w-full bg-paper px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-center justify-between mb-12">
          <div className="text-center flex-1">
            <span className="text-gold font-semibold tracking-wider uppercase text-sm">Our Clients</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mt-2">
              What Our Clients <span className="italic text-gold">Say</span>
            </h2>
          </div>
          {/* Carousel Navigation - always visible */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll('prev')}
              disabled={!canScrollLeft}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-current disabled:hover:border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
              onClick={() => scroll('next')}
              disabled={!canScrollRight}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-current disabled:hover:border-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
        
        {/* Carousel Container */}
        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-8 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="flex-shrink-0 w-[85vw] sm:w-[350px] md:w-[calc(33.333%-1.5rem)] bg-white p-8 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-black/5 relative">
                <div className="text-gold text-5xl absolute top-4 right-6 font-display opacity-30 leading-none">"</div>
                <div className="flex gap-1 text-gold mb-4">★★★★★</div>
                <p className="text-ink/70 italic mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={`https://i.pravatar.cc/100?img=${testimonial.img}`} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover"/>
                  <div>
                    <h5 className="font-bold text-ink">{testimonial.name}</h5>
                    <p className="text-xs text-ink/50">{testimonial.location}</p>
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

export default Testimonials