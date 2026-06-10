import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchForm from './SearchForm'

const Hero = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden bg-ink">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/Cover800x312_darken_3mb.mp4" type="video/mp4" />
      </video>

      <div className="relative z-10 mx-auto w-full max-w-[1500px] flex-1 flex flex-col">
        {/* NAVBAR */}
        <header className="relative z-50 flex items-center justify-between gap-4 px-6 py-6 md:px-12 lg:px-8">
          <nav className="hidden md:flex items-center gap-10 text-[15px] font-medium text-white/90">
            <a href="#parvozlar" onClick={(e) => { e.preventDefault(); scrollToSection('parvozlar') }} className="relative transition-colors duration-300 hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">HOME</a>
            <a href="#chegirmalar" onClick={(e) => { e.preventDefault(); scrollToSection('chegirmalar') }} className="relative transition-colors duration-300 hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">BUSINESS CLASS</a>
            <a href="#biz-haqimizda" onClick={(e) => { e.preventDefault(); scrollToSection('biz-haqimizda') }} className="relative transition-colors duration-300 hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">HOW TO BOOK</a>
            <a href="#fikrlar" onClick={(e) => { e.preventDefault(); scrollToSection('fikrlar') }} className="relative transition-colors duration-300 hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">TESTIMONIALS</a>
            <a href="#fikrlar" onClick={(e) => { e.preventDefault(); scrollToSection('fikrlar') }} className="relative transition-colors duration-300 hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">ABOUT US</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu}
              className="md:hidden text-white focus:outline-none p-2 rounded-lg bg-black/20 backdrop-blur-md"
            >
              <svg className={`w-7 h-7 ${mobileMenuOpen ? 'hidden' : 'block'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
              <svg className={`w-7 h-7 ${mobileMenuOpen ? 'block' : 'hidden'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          {/* Mobile Menu */}
          <div className={`absolute z-50 top-[90px] left-4 right-4 rounded-2xl glass-dark ${mobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-4 p-6 shadow-2xl md:hidden`}>
            <a href="#parvozlar" onClick={(e) => { e.preventDefault(); scrollToSection('parvozlar') }} className="mobile-nav-link text-white text-lg font-medium hover:text-gold">HOME</a>
            <hr className="border-white/10" />
            <a href="#chegirmalar" onClick={(e) => { e.preventDefault(); scrollToSection('chegirmalar') }} className="mobile-nav-link text-white text-lg font-medium hover:text-gold">BUSINESS CLASS</a>
            <hr className="border-white/10" />
            <a href="#biz-haqimizda" onClick={(e) => { e.preventDefault(); scrollToSection('biz-haqimizda') }} className="mobile-nav-link text-white text-lg font-medium hover:text-gold">AIRLINE OFFERS</a>
            <hr className="border-white/10" />
            <a href="#fikrlar" onClick={(e) => { e.preventDefault(); scrollToSection('fikrlar') }} className="mobile-nav-link text-white text-lg font-medium hover:text-gold">TESTIMONIALS</a>
            <hr className="border-white/10" />
            <a href="#fikrlar" onClick={(e) => { e.preventDefault(); scrollToSection('fikrlar') }} className="mobile-nav-link text-white text-lg font-medium hover:text-gold">ABOUT US</a>
            <hr className="border-white/10" />
            <a 
              href="tel:+998901234567"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-base font-medium text-white transition-all hover:bg-gold-dark w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              +998 90 123 45 67
            </a>
          </div>
        </header>

        {/* HERO CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 pt-6 md:px-12 lg:px-8 text-center">
          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
            Business &amp; First Class <span className="text-gold">Tickets</span>
          </h1>

          {/* Alliance logos row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {/* Star Alliance */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/star-alliance.png" alt="Star Alliance" className="w-8 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">STAR ALLIANCE</div>
                <div className="text-white/50 text-[10px] mt-0.5">28 airlines</div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/20 hidden sm:block"></div>

            {/* SkyTeam */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/skyteam.png" alt="SkyTeam" className="w-8 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">SKYTEAM</div>
                <div className="text-white/50 text-[10px] mt-0.5">19 airlines</div>
              </div>
            </div>

            <div className="w-px h-10 bg-white/20 hidden sm:block"></div>

            {/* Oneworld */}
            <div className="flex items-center gap-2.5">
              <img src="/pictures/oneworld.png" alt="Oneworld" className="w-25 h-8" />
              <div className="text-left">
                <div className="text-white font-bold text-sm tracking-wide leading-none">ONEWORLD</div>
                <div className="text-white/50 text-[10px] mt-0.5">13 airlines</div>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <SearchForm />

          {/* Savings tagline */}
          <p className="mt-6 text-gold-soft italic text-sm md:text-base font-medium">
            "Start your journey with <span className="font-bold text-gold not-italic">Staravia</span>"
          </p>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">TAC</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">Travel Assistance Company</div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">24·7</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">Live Concierge</div>
            </div>
            <div className="w-px h-8 bg-white/20 hidden sm:block"></div>
            <div className="flex flex-col items-center text-center">
              <div className="text-white font-black text-2xl leading-none font-display">200+</div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mt-0.5">Airlines</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
