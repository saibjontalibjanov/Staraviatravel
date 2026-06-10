import { useState } from 'react'

const TopBar = () => {
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [currentLang, setCurrentLang] = useState({ code: 'en', flag: 'gb', name: 'ENG' })

  const languages = [
    { code: 'en', flag: 'gb', name: 'English', shortName: 'ENG' },
    { code: 'ru', flag: 'ru', name: 'Русский', shortName: 'РУС' },
    { code: 'uz', flag: 'uz', name: 'Uzbek', shortName: 'UZB' }
  ]

  const handleLanguageChange = (lang) => {
    setCurrentLang({ code: lang.code, flag: lang.flag, name: lang.shortName })
    setShowLangDropdown(false)
  }

  return (
    <div className="w-full bg-white border-b border-gray-200 px-6 py-2 md:px-12 lg:px-8 sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-[1500px] flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 ml-8">
          <span className="font-display text-xl font-bold tracking-widest text-gold">STARAVIA</span>
          <div className="w-px h-8 bg-gray-300 mx-2"></div>
          <img src="/STARAVIA.png" alt="STARAVIA Logo" className="h-10 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
        </div>

        {/* Center: Features */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Accredited Agency */}
          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-pic1.png" alt="Navigation Icon" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">ACCREDITED</div>
              <div className="text-xs text-gray-500 leading-tight">AGENCY</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">Certified Travel Agency</div>
              <p className="text-xs text-gray-600 leading-relaxed">We are an officially accredited travel agency, authorized to provide premium flight booking services with guaranteed security and reliability.</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  Verified & Trusted
                </div>
              </div>
            </div>
          </div>

          {/* 24/7 Service */}
          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-24.png" alt="24/7 Service" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">24/7</div>
              <div className="text-xs text-gray-500 leading-tight">LIVE CONCIERGE</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">24/7 Customer Support</div>
              <p className="text-xs text-gray-600 leading-relaxed">Our dedicated team is available around the clock to assist you with bookings, changes, and any travel-related inquiries.</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  Always Available
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment */}
          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-secure.png" alt="Secure Payment" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">SECURE</div>
              <div className="text-xs text-gray-500 leading-tight">PAYMENT</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">100% Secure Transactions</div>
              <p className="text-xs text-gray-600 leading-relaxed">All payments are encrypted with SSL technology. We accept major credit cards and ensure your financial information is completely protected.</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  SSL Encrypted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Language + Phone */}
        <div className="flex items-center gap-4">
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          
          {/* Language Selector */}
          <div className="relative inline-block">
            <div 
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`fi fi-${currentLang.flag} rounded-sm`} style={{ width: '20px', height: '15px', display: 'inline-block' }}></span>
              <span className="text-gray-700 text-xs font-medium hover:text-gold transition-colors">{currentLang.name}</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            
            {showLangDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2 min-w-[120px]">
                {languages.map((lang) => (
                  <div 
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang)}
                    className="language-option flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className={`fi fi-${lang.flag} rounded-sm`} style={{ width: '20px', height: '15px', display: 'inline-block' }}></span>
                    <span className="text-sm text-gray-700 font-medium">{lang.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          
          {/* Phone Button */}
          <a 
            href="tel:+998901234567"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-dark transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            +998 90 123 45 67
          </a>
        </div>
      </div>
    </div>
  )
}

export default TopBar
