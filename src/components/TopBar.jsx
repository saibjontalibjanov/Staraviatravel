import { useState } from 'react'
import PhonePopup from './PhonePopup'
import navbarLogo from '../../pictures/icons/staravia-logo-horizontal.png'
import { useLanguage } from '../i18n/LanguageContext'
import { Link } from 'react-router-dom';

import { languages } from '../i18n/language';
import '../index.css'

const TopBar = ({ onPhoneClick }) => {
  const [phoneOpen, setPhoneOpen] = useState(false)
  const { t, language, setLanguage } = useLanguage()

  return (
    <>
    <div id='TopBarSticky' className="sticky w-full bg-white border-b border-gray-200 px-6 py-2 md:px-12 lg:px-8 top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-[1500px] flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/">
            <img src={navbarLogo} alt="Staravia Logo" width="1307" height="316" className="h-auto w-[112px] sm:w-[160px] lg:w-[200px] max-w-full object-contain" onError={(e) => e.target.style.display = 'none'} />
          </Link>
          {/* <div className="w-px h-8 bg-gray-300 mx-2"></div>
          <img src={Nav2} alt="STARAVIA Logo" className="h-8 w-auto object-cover" onError={(e) => e.target.style.display = 'none'} /> */}
        </div>

        {/* Center: Features */}
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-pic1.png" alt="Navigation Icon" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">{t("ACCREDITED")}</div>
              <div className="text-xs text-gray-500 leading-tight">{t("AGENCY")}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">{t("Certified Travel Agency")}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{t("We are an officially accredited travel agency, authorized to provide premium flight booking services with guaranteed security and reliability.")}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> {t("Verified & Trusted")} </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-24.png" alt="24/7 Service" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">24/7</div>
              <div className="text-xs text-gray-500 leading-tight">{t("LIVE CONCIERGE")}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">{t("24/7 Customer Support")}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{t("Our dedicated team is available around the clock to assist you with bookings, changes, and any travel-related inquiries.")}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> {t("Always Available")} </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 relative group cursor-pointer">
            <img src="/pictures/nav-pictures/nav-secure.png" alt="Secure Payment" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
            <div className="text-left">
              <div className="text-xs font-bold text-ink uppercase tracking-wide leading-tight">{t("SECURE")}</div>
              <div className="text-xs text-gray-500 leading-tight">{t("PAYMENT")}</div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="text-sm font-bold text-ink mb-2">{t("100% Secure Transactions")}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{t("All payments are encrypted with SSL technology. We accept major credit cards and ensure your financial information is completely protected.")}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gold font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> {t("SSL Encrypted")} </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Language + Phone */}
        <div className="flex items-center gap-4">
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          
          {/* Language Selector */}
          <div className="relative inline-flex items-center gap-2 text-gray-700">
            <svg aria-hidden="true" className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
              <path d="M3 12h18M12 3c4 5 4 13 0 18M12 3c-4 5-4 13 0 18" strokeWidth="1.5" />
            </svg>
            <label htmlFor="site-language" className="sr-only">{t('Website language')}</label>
            <select
              id="site-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="max-w-[130px] rounded-md border border-gray-200 bg-white px-2 py-2 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold"
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code} lang={item.code}>{item.name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-4 bg-gray-200 hidden sm:block"></div>
          
          {/* Phone Button - opens popup */}
          <button
            onClick={onPhoneClick || (() => setPhoneOpen(true))}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-dark transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            +998 90 123 45 67
          </button>
        </div>
      </div>
    </div>
    {!onPhoneClick && <PhonePopup isOpen={phoneOpen} onClose={() => setPhoneOpen(false)} />}
    </>
  )
}

export default TopBar
