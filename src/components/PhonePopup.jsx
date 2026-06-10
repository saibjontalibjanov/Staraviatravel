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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors group z-10 shadow-lg"
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

        {/* Popup Content */}
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Agent Photo */}
          <div className="w-full md:w-2/5 relative">
            <img
              src="/pictures/popup-pictures/agent-photo.jpg"
              alt="Travel Agent"
              className="w-full h-full object-cover min-h-[400px] md:min-h-[500px]"
              onError={(e) => (e.target.style.display = 'none')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Right Side - Content Area */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-ink mb-2">Request Received!</h3>
                <p className="text-gray-600">We'll call you back within a few minutes.</p>
              </div>
            ) : (
              <>
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-ink text-center mb-6">Call to speak 24/7</h2>

                {/* Phone Number Button */}
                <a
                  href="tel:+998901234567"
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-bold text-lg py-3 rounded-lg flex items-center justify-center gap-2 mb-6 transition-colors shadow-lg"
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
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="bg-white p-2 rounded-lg border-2 border-gray-200">
                    <img
                      src="/pictures/popup-pictures/staravia_qr_code.png"
                      alt="Scan to Call QR Code"
                      className="w-20 h-20 object-contain"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-ink leading-tight">SCAN</p>
                    <p className="text-xl font-bold text-ink leading-tight">TO CALL</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-gray-500 font-medium text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Request Callback Section */}
                <h3 className="text-xl font-bold text-ink text-center mb-3">Request a Free Callback</h3>
                <p className="text-center text-gray-600 text-sm mb-4">
                  Get a call from travel expert and free advice within minutes.
                </p>

                {/* Phone Input Form */}
                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-3 py-2 w-20">
                      <span className="text-lg">🇺🇿</span>
                      <span className="text-xs font-medium text-gray-700">+998</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter Phone"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                    />
                    <button
                      type="submit"
                      className="bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
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
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                  *One of our Travel Agents will call you back within the next{' '}
                  <span className="font-semibold text-gray-600">few minutes</span>. By submitting your phone number you
                  agree to be contacted for travel information via automated phone and text messages. Your consent to
                  receive such messages is not a condition of purchase.{' '}
                  <span className="font-semibold text-gray-600">
                    No Spam & <span className="underline">100% Data Safety</span>
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
