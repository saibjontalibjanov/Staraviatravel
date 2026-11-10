import { useLanguage } from '../i18n/LanguageContext'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { publicPages } from '../lib/visitors'

const CookieBanner = () => {
  const { t } = useLanguage()
  const { pathname } = useLocation()
  const isPublic = publicPages.includes(pathname)

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isPublic) { setIsVisible(false); return }
    let consent
    try { consent = localStorage.getItem('cookieConsent') } catch { /* Storage can be unavailable. */ }
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isPublic])

  const saveConsent = value => {
    try { localStorage.setItem('cookieConsent', value) } catch { /* Dismiss for this visit even without persistence. */ }
    window.dispatchEvent(new CustomEvent('staravia:consent', { detail: value }))
    if (value === 'rejected') { try { localStorage.removeItem('staravia_visitor_id') } catch {} }
    setIsVisible(false)
  }
  const handleAccept = () => saveConsent('accepted')
  const handleReject = () => saveConsent('rejected')

  if (!isPublic || !isVisible) return null

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-[420px] bg-white p-6 rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 z-[100] transition-transform duration-700 ${
        isVisible ? 'translate-y-0' : 'translate-y-[150%]'
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">🍪</span>
        <div>
          <h4 className="font-display text-lg font-bold text-ink">{t("Cookies")}</h4>
          <p className="text-sm text-ink/70 mt-1 leading-relaxed"> {t("We use cookies to improve your experience and provide personalized services.")} </p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-ink text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold transition-colors"
        > {t("Accept All")} </button>
        <button
          onClick={handleReject}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-gray-100 transition-colors border border-gray-200"
        > {t("Decline")} </button>
      </div>
    </div>
  )
}

export default CookieBanner
