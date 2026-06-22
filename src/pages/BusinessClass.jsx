import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';

const STRAPI_URL = 'http://localhost:1337';

const BusinessClass = () => {
  const [searchParams] = useSearchParams();
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch(`${STRAPI_URL}/api/hot-flights?populate=*`);
        const data = await response.json();
        const rawDeals = Array.isArray(data) ? data : (data.data || []);
        
        const formatted = rawDeals.map(item => {
          const attrs = item.attributes || item;
          let imageUrl = attrs.image;
          if (imageUrl && typeof imageUrl === 'object') {
            imageUrl = imageUrl.data?.attributes?.url || imageUrl.url;
          }
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/')) {
            imageUrl = `${STRAPI_URL}${imageUrl}`;
          }
          return {
            id: item.id,
            image: imageUrl,
            title: attrs.title || '',
            type: attrs.type || '',
            badge: attrs.badge || '',
            badgeColor: attrs.badgeColor || '#d4a445',
            price: attrs.price || '',
            oldPrice: attrs.oldPrice || '',
            link: attrs.link || '',
          };
        }).filter(item => item.image);

        setDeals(formatted);

        // Auto-select deal from URL param
        const dealId = searchParams.get('dealId');
        if (dealId) {
          const found = formatted.find(d => String(d.id) === dealId);
          if (found) setSelectedDeal(found);
        }
      } catch (err) {
        console.error('Failed to fetch hot deals:', err);
      }
    };
    fetchDeals();
  }, [searchParams]);

  // Use selected deal's image as background, or default
  const backgroundImage = selectedDeal?.image
    || 'https://images.unsplash.com/photo-1540339832862-4745ea9fb375?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

  // Use selected deal's texts or defaults
  const displayTitle = selectedDeal?.title || 'Premium Business Class Flights & Airline Tickets';
  const displayBadge = selectedDeal?.badge || '50-77% Off Discounted Business Class';
  const displayPrice = selectedDeal?.price || '$1,985';
  const displayOldPrice = selectedDeal?.oldPrice || '$4,963';
  const displayType = selectedDeal?.type || 'Discounted business class flights - 2026 from USA to Europe, Asia, Philippines, Africa, India etc. The cheapest business class flights with top airlines\' offers and deals.';

  const handleCardClick = (deal) => {
    setSelectedDeal(deal);
  };

  return (
    <>
      <TopBar />
      <div 
        className="min-h-screen relative flex items-center pt-24 pb-12 transition-all duration-500"
        style={{
          backgroundImage: `url("${backgroundImage}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            {/* Left side - Info & Prices */}
            <div className="text-white">
              <p className="text-[#d4a445] font-bold tracking-widest text-sm uppercase mb-4">
                {displayBadge}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-6">
                {displayTitle}
              </h1>
              <p className="text-gray-300 text-lg mb-10 max-w-xl">
                {displayType}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-l-4 border-[#d4a445] pl-6 py-2">
                <div>
                  <span className="inline-block bg-[#d4a445] text-black font-bold px-3 py-1 text-sm rounded mb-2">
                    🔥 This Month's Best Deal
                  </span>
                  <div className="flex items-baseline gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-sm">Old price:</span>
                      <span className="text-gray-400 line-through text-lg">{displayOldPrice}</span>
                    </div>
                    <span className="text-5xl font-bold text-white">{displayPrice}<span className="text-xl text-[#d4a445]">*</span></span>
                  </div>
                </div>
                
                <div className="hidden sm:block h-16 w-px bg-gray-600 mx-4"></div>
                
                <div className="text-sm font-semibold tracking-widest text-gray-300 uppercase leading-relaxed">
                  <span className="text-[#d4a445]">✦ Official</span><br/>
                  Airlines<br/>
                  Retailer
                </div>
              </div>

              <div className="mt-12 text-sm text-gray-400 space-y-1">
                <p><span className="text-[#d4a445] font-semibold">Lost Baggage Protection</span> $2000 Coverage for $45.95</p>
                <p>Last month we saved clients <span className="text-[#d4a445] font-semibold">over $1,700,000</span></p>
              </div>

              {/* Deal image cards from API */}
              <div className="mt-8 flex flex-wrap gap-3">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => handleCardClick(deal)}
                    className={`w-16 h-12 rounded-lg overflow-hidden shadow-md cursor-pointer transition-all hover:scale-110 ${
                      selectedDeal?.id === deal.id ? 'ring-2 ring-[#d4a445] scale-110' : 'hover:ring-1 hover:ring-white/50'
                    }`}
                  >
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Form */}
            <div className="bg-white rounded-md shadow-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <p className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1">— Want to save more? —</p>
                <h2 className="text-xl font-bold text-gray-800">
                  CALL US Toll-FREE <span className="font-normal text-gray-600">to Get the Best Unpublished Fares</span> <span className="text-red-600">and Save $100 Extra</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">or request an offer</p>
              </div>

              <form className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="First Name*" className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-[#d4a445] transition-colors" required />
                  <input type="text" placeholder="Last Name*" className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-[#d4a445] transition-colors" required />
                </div>

                {/* Email */}
                <input type="email" placeholder="Enter e-mail*" className="w-full border border-gray-300 rounded p-3 text-sm focus:outline-none focus:border-[#d4a445] transition-colors" required />
                
                {/* Phone */}
                <div className="flex border border-gray-300 rounded focus-within:border-[#d4a445] overflow-hidden transition-colors">
                  <span className="bg-gray-100 p-3 text-sm border-r border-gray-300 flex items-center">🇺🇿 +998</span>
                  <input type="tel" placeholder="Phone Number*" className="w-full p-3 text-sm focus:outline-none" required />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full bg-[#d4a445] hover:bg-[#b88c35] text-white font-bold text-lg py-4 rounded transition-all duration-300 mt-4 shadow-lg"
                >
                  GET FREE QUOTES
                </button>
              </form>

              <p className="text-[10px] text-gray-400 mt-4 leading-tight">
                *No Spam - only phone-exclusive deals. No purchase necessary. By providing your contact details you agree to be contacted for travel information.
              </p>

              {/* Stats */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-800">70%* OFF</p>
                  <p className="text-[10px] text-gray-500 uppercase">Phone-Only Deals</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">2M+</p>
                  <p className="text-[10px] text-gray-500 uppercase">Clients</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">500+</p>
                  <p className="text-[10px] text-gray-500 uppercase">Live Experts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessClass;
