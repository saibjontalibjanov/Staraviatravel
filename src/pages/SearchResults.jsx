import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import TopBar from '../components/TopBar';
import TrustBar from '../components/TrustBar';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';


const STRAPI_URL = 'http://localhost:1337';

// Book Flight Popup Component
const BookFlightPopup = ({ isOpen, onClose, flightInfo }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    paymentMethod: '',
    termsAccepted: false
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        paymentMethod: '',
        termsAccepted: false
      })
    }, 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-ink mb-2 font-display">Request Sent!</h3>
              <p className="text-gray-600">Our agent will contact you shortly.</p>
            </div>
          ) : (
            <>
              {/* Title */}
              <h2 className="text-2xl font-bold text-ink font-display mb-1">Book Flight</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your details and our agent will contact you.</p>

              {/* Flight Info Card */}
              {flightInfo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-ink text-sm">{flightInfo.airline}</p>
                    <p className="text-xs text-gray-500">{flightInfo.route}</p>
                  </div>
                  <p className="text-xl font-bold text-gold">${flightInfo.price.toLocaleString()}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📞</span>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📧</span>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Payment Method */}
                <select
                  name="paymentMethod"
                  required
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-ink bg-white focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="" disabled>Select payment method</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="debit-card">Debit Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    required
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-gold cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">I accept the Terms of Use and Privacy Policy</span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gold hover:bg-gold-dark text-white font-bold text-base py-3.5 rounded-xl transition-colors shadow-md"
                >
                  Submit Request
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const [showBookPopup, setShowBookPopup] = useState(false)
  const [selectedFlight, setSelectedFlight] = useState(null)
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cityImage, setCityImage] = useState(null)

  const from = searchParams.get('from') || 'Dubai'
  const to = searchParams.get('to') || 'New York'

  // Robust extraction of IATA codes
  const getCode = (val, defaultCode) => {
    if (!val) return defaultCode;
    const match = val.match(/\(([^)]+)\)/);
    if (match) return match[1].toUpperCase();
    if (val.trim().length === 3) return val.trim().toUpperCase();
    return defaultCode;
  };

  const fromCode = getCode(searchParams.get('from'), 'DXB');
  const toCode = getCode(searchParams.get('to'), 'JFK');

  const fromCity = from.replace(/\s*\([^)]*\)/, '')
  const toCity = to.replace(/\s*\([^)]*\)/, '')
  const passengers = searchParams.get('passengers') || '1'
  const cabin = searchParams.get('cabin') || 'Business'
  const tripType = searchParams.get('returnDate') ? 'round-trip' : 'one-way'
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0]
  const returnDate = searchParams.get('returnDate')

  useEffect(() => {
    const fetchCityImage = async () => {
      try {
        const res = await fetch(`${STRAPI_URL}/api/flights/city-media?cityName=${toCity}`);
        const data = await res.json();
        if (data.images && data.images.length > 0) {
          setCityImage(data.images[0].original);
        }
      } catch (err) {
        console.error("Shahar rasmini yuklashda xato:", err);
      }
    };

    if (toCity) fetchCityImage();

    const fetchOffers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Strapi backend-dagi proxy endpointga so'rov yuboramiz
        const response = await fetch(`${STRAPI_URL}/api/flightsearch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromCode,
            to: toCode,
            departureDate,
            returnDate: tripType === 'round-trip' ? returnDate : undefined,
            passengers: parseInt(passengers),
            cabin: cabin.toLowerCase(),
            type: tripType,
          }),
        });

        if (!response.ok) {
          throw new Error('Parvozlarni yuklashda xatolik yuz berdi');
        }

        const result = await response.json();
        console.log('Backend raw response:', result);

        // SerpApi xatolik qaytarganini tekshiramiz
        if (result.error || (result.search_metadata && result.search_metadata.status === "Error")) {
          throw new Error(result.error || result.search_metadata?.error || 'API qidiruvda xatolik yuz berdi');
        }

        // Handle both custom backend format and raw SerpApi structure
        // Ba'zan ma'lumotlar best_flights yoki other_flights ichida bo'ladi
        const rawOffers = result.data?.offers || result.best_flights || result.other_flights || [];

        if (!Array.isArray(rawOffers)) {
          throw new Error('Natijalar kutilgan formatda kelmadi');
        }

        const formattedOffers = rawOffers.map((offer, idx) => {
          // SerpApi Google Flights structure
          if (offer.flights && Array.isArray(offer.flights)) {
            const firstSegment = offer.flights[0];
            return {
              id: offer.id || `flight-${idx}`,
              airline: firstSegment.airline || 'Multiple Airlines',
              logo: firstSegment.airline_logo || null,
              logoText: firstSegment.airline || 'Flight',
              cabin: cabin + ' class',
              tripType: tripType,
              price: offer.price ? parseFloat(offer.price) : 0,
              oldPrice: offer.price ? parseFloat(offer.price) * 1.15 : 0,
              route: `${fromCity} → ${toCity}`
            };
          }
          
          // Custom/Existing structure fallback
          const airlineName = offer.owner?.name || offer.airline || 'Airline';
          const price = parseFloat(offer.total_amount || offer.price || 0) || 0;
          return {
            id: offer.id || idx,
            airline: airlineName,
            logo: offer.logo || null,
            logoText: airlineName,
            cabin: cabin + ' class',
            tripType: tripType,
            price: price,
            oldPrice: offer.oldPrice || price * 1.15,
            route: `${fromCity} → ${toCity}`
          };
        });

        setOffers(formattedOffers);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Chiptalarni yuklashda xatolik yuz berdi.');
      } finally {
        setLoading(false);
      }
    };

    if (fromCode && toCode) {
      fetchOffers();
    }
  }, [fromCode, toCode, departureDate, returnDate, passengers, cabin, tripType, toCity]);

  // Dynamic computed values based on API response
  const featuredDeal = offers.length > 0 ? offers[0] : null;
  const airlineOffers = offers.length > 1 ? offers.slice(1) : [];

  const stats = [
    { value: '10+', label: 'YEARS IN BUSINESS' },
    { value: '97%', label: 'SATISFACTION RATE' },
    { value: '2M+', label: 'CLIENTS SERVED' },
    { value: '500+', label: 'LIVE AGENTS' }
  ]

  const handleFeaturedClick = () => {
    if (!featuredDeal) return;
    setSelectedFlight({
      airline: featuredDeal?.airline || 'Featured Deal',
      route: `${fromCity} (${fromCode}) → ${toCity} (${toCode})`,
      price: featuredDeal?.price || 0
    })
    setShowBookPopup(true)
  }

  const handleOfferClick = (offer) => {
    setSelectedFlight({
      airline: offer.airline,
      route: `${fromCity} (${fromCode}) → ${toCity} (${toCode})`,
      price: offer.price
    })
    setShowBookPopup(true)
  }

  return (
    <div className="bg-white text-ink font-sans antialiased selection:bg-gold selection:text-white min-h-screen">
      {/* Header */}
      <TopBar />

      {/* Main Content */}
      <main className="mx-auto max-w-[1200px] px-6 py-8">

        {/* Featured Deal Card - Clickable */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-ink/60 font-medium">Eng yaxshi parvozlarni qidirmoqdamiz...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-red-600 font-bold mb-2">Xatolik</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Ushbu yo'nalish bo'yicha chiptalar topilmadi.</p>
            <Link to="/" className="text-gold hover:underline mt-4 inline-block">Yangi qidiruv</Link>
          </div>
        ) : (
          <>
            {/* Featured Deal Card - Clickable */}
            {featuredDeal && (
              <div
                onClick={handleFeaturedClick}
                className="border border-gray-200 rounded-lg p-6 mb-6 cursor-pointer hover:border-gold/50 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Route Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-bold text-ink">{fromCity}</h2>
                      <span className="bg-gray-100 border border-gray-300 text-xs font-bold text-ink px-2 py-0.5 rounded">{fromCode}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-ink">{toCity}</h2>
                      <span className="bg-gray-100 border border-gray-300 text-xs font-bold text-ink px-2 py-0.5 rounded">{toCode}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {cabin} | {tripType} | {passengers} Passenger{passengers > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Price Section */}
                  <div className="flex items-center gap-6">
                    <div>
                      {/* Urgency Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/30 text-gold-dark px-3 py-1 rounded-full text-xs font-bold mb-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        Hurry! Limited Seats!
                      </div>
                      <div className="flex items-baseline gap-3">
                        <div>
                          <p className="text-xs text-gray-400">Old Price:</p>
                          <p className="text-sm text-gray-400 line-through">${featuredDeal?.oldPrice?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-4xl font-bold text-ink">${featuredDeal?.price?.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 align-top">*</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <p>per</p>
                          <p>person</p>
                        </div>
                      </div>
                    </div>

                    {/* Official Retailer Badge */}
                    <div className="hidden sm:flex items-center gap-4 pl-6 border-l border-gray-200">
                      <div className="text-center">
                        <div className="border-2 border-ink px-2 py-1 mb-1">
                          <p className="text-[8px] font-bold text-ink leading-tight">OFFICIAL</p>
                          <p className="text-[8px] font-bold text-ink leading-tight">AIRLINES</p>
                          <p className="text-[8px] font-bold text-ink leading-tight">RETAILER</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lost Baggage Protection Banner */}
            <div className="bg-gray-100 border border-gray-200 rounded-lg py-3 px-6 mb-8 text-center">
              <p className="text-sm font-bold text-ink">Lost Baggage Protection</p>
            </div>

            {/* Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10 py-6 border-t border-b border-gray-100">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-ink font-display">{stat.value}</span>
                  <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase leading-tight max-w-[80px]">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Airline Offer Cards - Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {airlineOffers.map((offer, idx) => (
                <div
                  key={idx}
                  onClick={() => handleOfferClick(offer)}
                  className="border border-gray-200 rounded-lg p-5 hover:border-gold/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Airline Name/Logo */}
                  <div className="mb-4 h-10 flex items-center gap-3">
                    {offer.logo ? (
                      <img src={offer.logo} alt={offer.airline} className="h-full w-auto object-contain" />
                    ) : (
                      <span className="text-lg font-bold text-ink">{offer.logoText}</span>
                    )}
                  </div>

                  {/* Trip Details */}
                  <p className="text-sm text-gray-500 mb-4">
                    {offer.cabin} | {offer.tripType}
                  </p>

                  {/* Price + Arrow */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-ink">${offer?.price?.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 align-top">*</span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-[10px] text-gray-400 mt-6 leading-relaxed">
              *Prices are per person, subject to availability and may change without notice. Additional taxes and fees may apply. Contact our travel agents for the most up-to-date pricing.
            </p>

          </>
        )}
      </main>

      {/* Floating Phone Button */}
      <a
        href="tel:+998901234567"
        className="phone-btn fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="Call Us"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </a>

      {/* Book Flight Popup */}
      <BookFlightPopup
        isOpen={showBookPopup}
        onClose={() => setShowBookPopup(false)}
        flightInfo={selectedFlight}
      />

      <TrustBar />
      <FAQ />
      <Footer />
    </div>
  )
}
{
  (

      {/* Floating Phone Button */}
      <a
        href="tel:+998901234567"
        className="phone-btn fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="Call Us"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      </a>

      {/* Book Flight Popup */}
      <BookFlightPopup
        isOpen={showBookPopup}
        onClose={() => setShowBookPopup(false)}
        flightInfo={selectedFlight}
      />
    <div>
      <TrustBar />
      <FAQ />
      <Footer />
    </div>
  )
}

export default SearchResults
