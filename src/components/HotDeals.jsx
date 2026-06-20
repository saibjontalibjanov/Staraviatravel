import { useState, useRef, useEffect } from 'react'
import Cards from './Cards'

const STRAPI_URL = 'http://localhost:1337';

// Define a type/interface for your deal structure for better type safety (optional, but good practice)
// interface Deal {
//   destination: string;
//   type: string;
//   oldPrice?: string;
//   price: string;
//   badge: string;
//   badgeColor: string;
//   image: string;
//   from: string;
//   to: string;
// }

const HotDeals = () => {
  const carouselRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [deals, setDeals] = useState([]) // Initialize as an empty array
  const [loading, setLoading] = useState(true) // Set loading to true initially
  const [error, setError] = useState(null) // State to store any fetch errors

  useEffect(() => {
    const fetchHotDeals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Note: Added ?populate=* to ensure Strapi returns the image data
        const response = await fetch(`${STRAPI_URL}/api/hot-flights?populate=*`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Strapi returns an object with a 'data' property. 
        // We handle both Strapi format and plain array format.
        const rawDeals = Array.isArray(data) ? data : (data.data || []);

        // Strapi nests fields inside 'attributes'. 
        // We flatten it so deal.destination, deal.image, etc. work in the Cards component.
        const formattedDeals = rawDeals.map(item => {
          const attrs = item.attributes || item;
          let imageUrl = attrs.image;

          // 1. Handle Strapi's nested media structure
          if (imageUrl && typeof imageUrl === 'object') {
            // Checks for Strapi v4/v5 structure or simplified formats
            imageUrl = imageUrl.data?.attributes?.url || imageUrl.url;
          }

          // 2. Prepend base URL if the path is relative (starts with /)
          if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/')) {
            imageUrl = `${STRAPI_URL}${imageUrl}`;
          }

          return { id: item.id, ...attrs, image: imageUrl };
        });

        setDeals(formattedDeals);
      } catch (e) {
        console.error("Failed to fetch hot deals:", e);
        setError("Failed to load hot deals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotDeals();
  }, []); // Empty dependency array means this runs once on mount

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 296 // card width (280) + gap (16)
      const newIndex = direction === 'next'
        ? Math.min(currentIndex + 1, deals.length - 1)
        : Math.max(currentIndex - 1, 0)

      carouselRef.current.scrollTo({
        left: newIndex * scrollAmount,
        behavior: 'smooth'
      })
      setCurrentIndex(newIndex)
    }
  }

  const handleDealClick = (deal) => {
    if (deal.link) {
      // Navigate to the external or internal link provided by the API
      window.location.href = deal.link;
    } else {
      // Fallback: Scroll to the search section if no link is provided
      const flightSection = document.getElementById('parvozlar');
      if (flightSection) {
        flightSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  return (
    <section id="chegirmalar" className="w-full bg-[#f0ebe1] px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-center justify-between mb-12">
          <div>
            <span className="text-gold font-semibold tracking-wider uppercase text-sm">Special Offers</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mt-2">Hot <span className="italic text-gold">Deals</span></h2>
          </div>
          {/* Carousel Navigation */}
          <div className="flex gap-3">
            <button
              onClick={() => scroll('prev')}
              disabled={loading || currentIndex === 0}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('next')}
              disabled={loading || deals.length === 0 || currentIndex === (deals.length - 1)}
              className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gold hover:text-white hover:border-gold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-ink text-lg">Loading hot deals...</p>
        ) : error ? (
          <p className="text-center text-red-600 text-lg">{error}</p>
        ) : deals.length === 0 ? (
          <p className="text-center text-ink/70 text-lg">No hot deals available at the moment.</p>
        ) : (
          /* Carousel Container */
          <div className="relative overflow-hidden">
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {deals.map((deal, index) => (
                <Cards key={deal.id || index} deal={deal} handleDealClick={handleDealClick} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default HotDeals
