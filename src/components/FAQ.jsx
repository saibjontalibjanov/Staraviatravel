import { useState } from 'react'

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'How do I purchase a ticket?',
      answer: 'Fill in the form above and click "Search Flights". Our agents will contact you and offer the best available options.'
    },
    {
      question: 'How is payment made?',
      answer: 'You can pay by cash, bank card, or bank transfer. All payments are 100% secure.'
    },
    {
      question: 'Can I cancel my ticket?',
      answer: 'Yes, tickets can be cancelled or changed according to airline rules. Please contact us for more details.'
    },
    {
      question: 'Is there a fee for extra baggage?',
      answer: 'Baggage allowances vary by ticket class and airline. Our agents will provide you with detailed information.'
    },
    {
      question: 'What documents do I need for international flights?',
      answer: "You'll need a valid passport with at least 6 months validity, and possibly a visa depending on your destination. Our travel experts can guide you through all documentation requirements."
    },
    {
      question: 'How far in advance should I book my flight?',
      answer: 'For the best prices, we recommend booking 2-3 months in advance for international flights and 3-4 weeks for domestic flights. However, we can also assist with last-minute bookings.'
    },
    {
      question: "What's the difference between Business and First Class?",
      answer: 'First Class offers more privacy, fully-flat beds, exclusive lounges, and premium dining. Business Class provides lie-flat seats, priority boarding, and excellent service at a more accessible price point.'
    },
    {
      question: 'Do you offer travel insurance?',
      answer: 'Yes, we can arrange comprehensive travel insurance covering medical emergencies, trip cancellation, lost baggage, and more. Contact our agents for detailed coverage options.'
    },
    {
      question: 'Can I select my seat in advance?',
      answer: 'Yes, seat selection is available for most airlines. Premium and Business Class tickets often include free seat selection, while Economy may have additional fees depending on the airline.'
    },
    {
      question: 'What happens if my flight is delayed or cancelled?',
      answer: "If your flight is delayed or cancelled, we'll assist you in rebooking on the next available flight. Airlines may provide compensation depending on the circumstances. Our 24/7 support team is always ready to help."
    },
    {
      question: 'Are there any hidden fees when booking?',
      answer: 'No hidden fees! We provide transparent pricing that includes all taxes and fees. Any additional costs (such as baggage fees or seat selection) will be clearly communicated before you confirm your booking.'
    },
    {
      question: 'How do I receive my tickets?',
      answer: 'After booking confirmation and payment, your e-ticket will be sent to your email within 24 hours. You can also access your booking through our customer portal or contact our agents for assistance.'
    }
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full bg-[#f0ebe1] px-6 py-20 md:px-12 lg:px-8">
      <div className="mx-auto max-w-[800px]">
        <div className="text-center mb-12">
          <span className="text-gold font-semibold tracking-wider uppercase text-sm">FAQ</span>
          <h2 className="font-display text-4xl font-bold text-ink mt-2">
            Frequently Asked <span className="italic text-gold">Questions</span>
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-black/5 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-ink hover:text-gold transition-colors"
              >
                <span>{faq.question}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-ink/70 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQ
