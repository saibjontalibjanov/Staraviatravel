import { useState } from 'react'
import TopBar from '../components/TopBar'
import Hero from '../components/Hero'
import TrustBar from '../components/TrustBar'
import HotDeals from '../components/HotDeals'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import FloatingButtons from '../components/FloatingButtons'
import PhonePopup from '../components/PhonePopup'
import CookieBanner from '../components/CookieBanner'

const Home = () => {
  const [showPhonePopup, setShowPhonePopup] = useState(false)

  return (
    <div className="bg-paper text-ink font-sans antialiased selection:bg-gold selection:text-white relative overflow-x-hidden">
      <TopBar />
      <main className="w-full">
        <Hero />
        <TrustBar />

        {/* Hot Deals Section */}
        <HotDeals />

        {/* Why Choose Us Section */}
        <section id="parvozlar" class="w-full bg-white px-6 py-20 md:px-12 lg:px-8">
          <div className="mx-auto w-full max-w-[1500px]">

            <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <div id="carousel-1" className="flex transition-transform duration-500 ease-out h-full">
                    <img src="./pictures/Trust-section-pictures/Business-class-picture1.jpg" alt="Business Class 1" class="w-full h-full object-cover flex-shrink-0"/>
                    <img src="./pictures/Trust-section-pictures/Business-class-picture2.jpg" alt="Business Class 2" class="w-full h-full object-cover flex-shrink-0"/>
                    <img src="./pictures/Trust-section-pictures/Business-class-picture3.jpg" alt="Business Class 3" class="w-full h-full object-cover flex-shrink-0"/>
                  </div>
                  <button onclick="moveCarousel('carousel-1', -1)" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button onclick="moveCarousel('carousel-1', 1)" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    <div className="carousel-1-dot w-2 h-2 rounded-full bg-white transition-all"></div>
                    <div className="carousel-1-dot w-2 h-2 rounded-full bg-white/50 transition-all"></div>
                    <div className="carousel-1-dot w-2 h-2 rounded-full bg-white/50 transition-all"></div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold/20 rounded-2xl -z-10"></div>
              </div>
              <div>
                <h2 class="font-display text-4xl md:text-5xl font-bold text-ink leading-tight">
                  STARAVIA Travel is Trusted<br/>by Over <span class="text-gold">188K+ Travelers</span>
                </h2>
                <p class="mt-6 text-ink/70 text-lg leading-relaxed">
                  Welcome to Staravia Travel! Our commitment is to provide all our clients with excellent personal service, 24 hours a day, 7 days a week. We have perfected the art of making your travel experience as smooth as possible – from start to finish.
                </p>
                <p class="mt-4 text-ink/60 leading-relaxed">
                  If you would rather have travel comfort for you or your business, our quality is what we help you. We are among the best possible value for the money. Feel free to reach out! These talented employees are on phone or email with any questions or concerns. We look forward to assisting you!
                </p>
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-12 items-center mb-20">
              <div class="order-2 lg:order-1">
                <div class="border-l-4 border-gold pl-6">
                  <h3 class="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
                    Expert First & Business Class<br/>Travel Management
                  </h3>
                </div>
                <p class="mt-6 text-ink/70 leading-relaxed">
                  At Staravia Travel, you get your Personal Travel Manager - your own flight personal shopper, providing a bespoke plus travel search. Save your valuable time and avoid stress into your dedicated travel expert to take care of all your arrangements. Our team will work with you to offer you more with your preferences and priorities top of mind.
                </p>
              </div>
              <div class="relative group order-1 lg:order-2">
                <div class="aspect-square rounded-2xl overflow-hidden shadow-2xl">
                  <div id="carousel-2" class="flex transition-transform duration-500 ease-out h-full">
                    <img src="https://images.unsplash.com/photo-1556388158-158ea5ccacbd?auto=format&fit=crop&w=600&q=80" alt="First Class 1" class="w-full h-full object-cover flex-shrink-0"/>
                    <img src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80" alt="First Class 2" class="w-full h-full object-cover flex-shrink-0"/>
                    <img src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=600&q=80" alt="First Class 3" class="w-full h-full object-cover flex-shrink-0"/>
                  </div>
                  <button onclick="moveCarousel('carousel-2', -1)" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100">
                    <svg class="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button onclick="moveCarousel('carousel-2', 1)" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100">
                    <svg class="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    <div class="carousel-2-dot w-2 h-2 rounded-full bg-white transition-all"></div>
                    <div class="carousel-2-dot w-2 h-2 rounded-full bg-white/50 transition-all"></div>
                    <div class="carousel-2-dot w-2 h-2 rounded-full bg-white/50 transition-all"></div>
                  </div>
                </div>
                <div class="absolute -top-6 -left-6 w-32 h-32 bg-gold/20 rounded-2xl -z-10"></div>
              </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-12">
              <div class="bg-[#f0ebe1] rounded-3xl p-8">
                <div class="w-16 h-1 bg-gold mb-6"></div>
                <h3 class="font-display text-2xl md:text-3xl font-bold text-ink mb-4">
                  Real People Instead of Online Engines
                </h3>
                <p class="text-ink/70 leading-relaxed">
                  There are no website booking engines here. With Staravia Travel, you deal with a real person who understands your needs. We make each quote different from the others to provide attractive ticket prices. Our team and partners are using available in all facets of the reservation we have with the major airlines, all of which can only be easily accomplished today. This is how you get the absolute best price and value.
                </p>
              </div>
              <div class="bg-[#f0ebe1] rounded-3xl p-8">
                <div class="w-16 h-1 bg-gold mb-6"></div>
                <h3 class="font-display text-2xl md:text-3xl font-bold text-ink mb-4">
                  After-Hours Support Until You Return
                </h3>
                <p class="text-ink/70 leading-relaxed">
                  Every customer we've secured more than expert travel advice and unbeatable prices and holidays on offer, professional advice. Our free after-hours assistance means the 7 unexpected changes and/or new can always be reached to handle schedule, immediate offers.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Call to Action Section */}
        <section id="biz-haqimizda" className="w-full bg-gradient-to-br from-[#fdfcfb] via-[#f8f6f0] to-[#fdfcfb] py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gold/10 rounded-full blur-3xl"></div>

          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative flex justify-center lg:justify-start">
                <div className="relative w-full max-w-md">
                  <img
                    src="/pictures/popup-pictures/woman-business-class.png"
                    alt="Luxury Travel Concierge"
                    className="relative z-10 w-full h-auto object-contain drop-shadow-2xl rounded-full"
                    style={{ border: '20px solid white' }}
                  />
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
                  <a
                    href="tel:+998901234567"
                    className="bg-gradient-to-br from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-white font-bold px-8 py-4 rounded-xl flex items-center gap-3 shadow-glow transition-all hover:scale-105 hover:shadow-xl border border-gold-dark/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span className="tracking-wide">+998 90 123 45 67</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="fikrlar" className="w-full bg-paper px-6 py-20 md:px-12 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <div className="text-center mb-12">
              <span className="text-gold font-semibold tracking-wider uppercase text-sm">Our Clients</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mt-2">
                What Our Clients <span className="italic text-gold">Say</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { name: 'Aziza K.', location: 'Tashkent, Uzbekistan', text: 'Finding a ticket through the website was so easy. The agents found me the cheapest and most convenient flight. Thank you so much!', img: 1 },
                { name: 'Rustam B.', location: 'Samarkand, Uzbekistan', text: 'We bought tickets for a family holiday to Dubai. The prices were very affordable and the service quality was excellent.', img: 11 },
                { name: 'Malika O.', location: 'Bukhara, Uzbekistan', text: 'The support center works great. When my flight changed, they resolved the issue immediately.', img: 5 },
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-black/5 relative">
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
        </section>

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
