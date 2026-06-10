import { useState, useEffect } from 'react'

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already accepted/rejected cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    setIsVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected')
    setIsVisible(false)
  }

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
          <h4 className="font-display text-lg font-bold text-ink">Cookies</h4>
          <p className="text-sm text-ink/70 mt-1 leading-relaxed">
            We use cookies to improve your experience and provide personalized services.
          </p>
        </div>
      </div>
      <div className="mt-5 flex gap-3">
        <button
          onClick={handleAccept}
          className="flex-1 bg-ink text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gold transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={handleReject}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Decline
        </button>
      </div>
    </div>
  )
}

export default CookieBanner
