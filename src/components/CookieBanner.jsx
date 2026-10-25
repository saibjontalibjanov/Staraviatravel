import { useLanguage } from '../i18n/LanguageContext'
import { useState, useEffect } from 'react'

const CookieBanner = () => {
  const { t } = useLanguage()

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let consent
    try { consent = localStorage.getItem('cookieConsent') } catch { /* Storage can be unavailable. */ }
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveConsent = value => {
    try { localStorage.setItem('cookieConsent', value) } catch { /* Dismiss for this visit even without persistence. */ }
    setIsVisible(false)
  }
  const handleAccept = () => saveConsent('accepted')
  const handleReject = () => saveConsent('rejected')

  if (!isVisible) return null

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
