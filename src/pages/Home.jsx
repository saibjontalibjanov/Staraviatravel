import { useState, useRef } from 'react'
import TopBar from '../components/TopBar'
import Hero from '../components/Hero'
import TrustBar from '../components/TrustBar'
import HotDeals from '../components/HotDeals'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import FloatingButtons from '../components/FloatingButtons'
import PhonePopup from '../components/PhonePopup'
import CookieBanner from '../components/CookieBanner'

// Image Carousel Component for About Us
const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="relative group">
      <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative">
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`Business Class ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {/* Navigation Buttons */}
        <button 
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button 
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold/20 rounded-2xl -z-10"></div>
    </div>
  )
}

// Testimonials Carousel Component
const TestimonialsCarousel = () => {
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

const Home = () => {
  const [showPhonePopup, setShowPhonePopup] = useState(false)

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-gold selection:text-white relative overflow-x-hidden">
      <TopBar onPhoneClick={() => setShowPhonePopup(true)} />
      <main className="w-full">
        <Hero />
        <TrustBar />
        
        {/* Hot Deals Section */}
        <HotDeals />

        {/* Why Choose Us Section - with working carousel */}
        <section id="parvozlar" className="w-full bg-white px-6 py-20 md:px-12 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {/* First Row */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <ImageCarousel 
                images={[
                  '/pictures/Trust-section-pictures/Business-class-picture1.jpg',
                  '/pictures/Trust-section-pictures/Business-class-picture2.jpg',
                  '/pictures/Trust-section-pictures/Business-class-picture3.jpg'
                ]}
              />
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-ink leading-tight">
                  STARAVIA Travel is Trusted<br/>by Over <span className="text-gold">188K+ Travelers</span>
                </h2>
                <p className="mt-6 text-ink/70 text-lg leading-relaxed">
                  Welcome to Staravia Travel! Our commitment is to provide all our clients with excellent personal service, 24 hours a day, 7 days a week. We have perfected the art of making your travel experience as smooth as possible – from start to finish.
                </p>
                <p className="mt-4 text-ink/60 leading-relaxed">
                  If you would rather have travel comfort for you or your business, our quality is what we help you. We are among the best possible value for the money. Feel free to reach out! These talented employees are on phone or email with any questions or concerns. We look forward to assisting you!
                </p>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 lg:order-1">
                <div className="border-l-4 border-gold pl-6">
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
                    Expert First &amp; Business Class<br/>Travel Management
                  </h3>
                </div>
                <p className="mt-6 text-ink/70 leading-relaxed">
                  At Staravia Travel, you get your Personal Travel Manager - your own flight personal shopper, providing a bespoke plus travel search. Save your valuable time and avoid stress into your dedicated travel expert to take care of all your arrangements. Our team will work with you to offer you more with your preferences and priorities top of mind.
                </p>
              </div>
              <div className="relative group order-1 lg:order-2">
                <ImageCarousel 
                  images={[
                    'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=600&q=80'
                  ]}
                />
              </div>
            </div>

            {/* Third Row: Two Column Text */}
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-[#f0ebe1] rounded-3xl p-8">
                <div className="w-16 h-1 bg-gold mb-6"></div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-ink mb-4">
                  Real People Instead of Online Engines
                </h3>
                <p className="text-ink/70 leading-relaxed">
                  There are no website booking engines here. With Staravia Travel, you deal with a real person who understands your needs. We make each quote different from the others to provide attractive ticket prices.
                </p>
              </div>
              <div className="bg-[#f0ebe1] rounded-3xl p-8">
                <div className="w-16 h-1 bg-gold mb-6"></div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-ink mb-4">
                  After-Hours Support Until You Return
                </h3>
                <p className="text-ink/70 leading-relaxed">
                  Every customer receives more than expert travel advice and unbeatable prices. Our free after-hours assistance means unexpected changes can always be handled with schedule and immediate offers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Exclusive Deals - phone popup on click */}
        <section id="biz-haqimizda" className="w-full bg-gradient-to-br from-[#fdfcfb] via-[#f8f6f0] to-[#fdfcfb] py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold/10 rounded-full blur-3xl"></div>
          
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #D4A445 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          
          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative flex justify-center lg:justify-start">
                {/* Decorative phone icon floating */}
                <div className="absolute top-8 left-1/4 bg-white rounded-full p-5 shadow-[0_20px_60px_-15px_rgba(212,164,69,0.3)] border border-gold/20 animate-float z-20">
                  <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 10.999h2C22 5.869 18.127 2 12.99 2v2C17.052 4 20 6.943 20 10.999z"/>
                    <path d="M13 8c2.103 0 3 .897 3 3h2c0-3.225-1.775-5-5-5v2zm3.422 5.443a1.001 1.001 0 00-1.391.043l-2.393 2.461c-.576-.11-1.734-.471-2.926-1.66-1.192-1.193-1.553-2.354-1.66-2.926l2.459-2.394a1 1 0 00.043-1.391L6.859 3.513a1 1 0 00-1.391-.087l-2.17 1.861a1 1 0 00-.29.649c-.015.25-.301 6.172 4.291 10.766C11.305 20.707 16.323 21 17.705 21c.202 0 .326-.006.359-.008a.992.992 0 00.648-.291l1.86-2.171a.997.997 0 00-.086-1.391l-4.064-3.696z"/>
                  </svg>
                </div>
                
                {/* Main circular background with luxury styling */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-gold/5 rounded-full transform scale-110 blur-3xl"></div>
                  <div className="absolute inset-0 border border-gold/20 rounded-full transform scale-105"></div>
                  <div className="relative w-full max-w-md">
                    <img 
                      src="/pictures/popup-pictures/woman-business-class.png" 
                      alt="Luxury Travel Concierge" 
                      className="relative z-10 w-full h-auto object-contain drop-shadow-2xl rounded-full" 
                      style={{ border: '20px solid white' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center mb-8">
                  <span className="bg-gradient-to-r from-gold to-gold-dark text-white px-8 py-3 rounded-full text-sm font-bold tracking-widest shadow-glow border border-gold-dark/20">
                    SAVE UP TO 50%
                  </span>
                </div>
                
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
                  Exclusive <span className="text-gold italic">Deals</span>
                </h2>
                
                <p className="text-ink/70 text-lg leading-relaxed mb-10 max-w-md mx-auto lg:mx-0 font-light">
                  Call now and let our professional travel concierge secure your premium ticket at the most competitive price
                </p>
                
                <div className="inline-flex flex-col sm:flex-row items-center gap-6 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-gold/10">
                  <div className="text-left">
                    <p className="text-ink font-bold text-xl mb-1 font-display">Interested?</p>
                    <p className="text-ink/60 text-sm font-light">Experience luxury travel consultation</p>
                  </div>
                  <button
                    onClick={() => setShowPhonePopup(true)}
                    className="bg-gradient-to-br from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-bold px-8 py-4 rounded-xl flex items-center gap-3 shadow-glow transition-all hover:scale-105 hover:shadow-xl border border-gold-dark/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span className="tracking-wide">+998 90 123 45 67</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - with carousel and responsive buttons */}
        <TestimonialsCarousel />

        {/* FAQ Section */}
        <FAQ />

        {/* Footer */}
        <Footer />
      </main>

      {/* Floating Buttons */}
      <FloatingButtons onPhoneClick={() => setShowPhonePopup(true)} />

      {/* Phone Popup Modal */}
      <PhonePopup isOpen={showPhonePopup} onClose={() => setShowPhonePopup(false)} />

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  )
}

export default Home
