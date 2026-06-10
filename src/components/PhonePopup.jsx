import { useState } from 'react'

const PhonePopup = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setPhoneNumber('')
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors group z-20 shadow-lg"
        >
          <svg
            className="w-5 h-5 text-gray-600 group-hover:text-ink"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Popup Content - scrollable */}
        <div className="flex flex-col md:flex-row overflow-y-auto max-h-[90vh]">
          {/* Left Side - Agent Photo (hidden on small screens) */}
          <div className="hidden md:block w-2/5 relative flex-shrink-0">
            <img
              src="/pictures/popup-pictures/agent-photo.jpg"
              alt="Travel Agent"
              className="w-full h-full object-cover min-h-[400px]"
              onError={(e) => (e.target.style.display = 'none')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Right Side - Content Area */}
          <div className="flex-1 p-5 md:p-7 flex flex-col justify-center overflow-y-auto">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink mb-2">Request Received!</h3>
                <p className="text-gray-600 text-sm">We'll call you back within a few minutes.</p>
              </div>
            ) : (
              <>
                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-ink text-center mb-4">Call to speak 24/7</h2>

                {/* Phone Number Button */}
                <a
                  href="tel:+998901234567"
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold text-base py-3 rounded-lg flex items-center justify-center gap-2 mb-4 transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  +998 90 123 45 67
                </a>

                {/* QR Code Section */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="bg-white p-1.5 rounded-lg border-2 border-gray-200">
                    <img
                      src="/pictures/popup-pictures/staravia_qr_code.png"
                      alt="Scan to Call QR Code"
                      className="w-16 h-16 object-contain"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-ink leading-tight">SCAN</p>
                    <p className="text-lg font-bold text-ink leading-tight">TO CALL</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-gray-500 font-medium text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Request Callback Section */}
                <h3 className="text-lg font-bold text-ink text-center mb-2">Request a Free Callback</h3>
                <p className="text-center text-gray-600 text-xs mb-3">
                  Get a call from travel expert and free advice within minutes.
                </p>

                {/* Phone Input Form */}
                <form onSubmit={handleSubmit} className="mb-3">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-2 py-2 w-[70px] flex-shrink-0">
                      <span className="text-base">🇺🇿</span>
                      <span className="text-xs font-medium text-gray-700">+998</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter Phone"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all min-w-0"
                    />
                    <button
                      type="submit"
                      className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </button>
                  </div>
                </form>

                {/* Disclaimer Text */}
                <p className="text-[9px] text-gray-400 leading-relaxed text-center">
                  *One of our Travel Agents will call you back within the next{' '}
                  <span className="font-semibold text-gray-600">few minutes</span>. By submitting your phone number you
                  agree to be contacted for travel information via automated phone and text messages.{' '}
                  <span className="font-semibold text-gray-600">
                    No Spam &amp; <span className="underline">100% Data Safety</span>
                  </span>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhonePopup
