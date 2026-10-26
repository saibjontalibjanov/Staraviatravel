import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faCoins, faGlobe, faHeart, faStar } from '@fortawesome/free-solid-svg-icons'
import { useLanguage } from '../i18n/LanguageContext'
import TopBar from '../components/TopBar'
import Testimonials from '../components/Testimonials'
import MainNavbar from '../components/MainNavbar'
import PhonePopup from '../components/PhonePopup'
import BusinessSeat from '../../pictures/seats/business-seat.jpg'
import FirstClass from '../../pictures/seats/firstclass-seat.jpg'
import './AboutUs.css'

const benefits = [
  { icon: faCoins, title: 'Transparent fares', description: 'Every fare and service is explained clearly, so you know exactly what to expect.' },
  { icon: faGlobe, title: 'International destinations', description: 'We find the right option for you across airlines and destinations worldwide.' },
  { icon: faHeart, title: 'A personal approach', description: 'Every question matters. Every journey begins with listening to you.' },
]

export default function AboutUs() {
  const { t } = useLanguage()
  const [showPhonePopup, setShowPhonePopup] = useState(false)

  return (
    <div className="about-page">
      <TopBar onPhoneClick={() => setShowPhonePopup(true)} />
      <main id="about">
        <section className="about-hero" aria-labelledby="about-title">
          <video autoPlay loop muted playsInline preload="metadata" poster="/pictures/about/clouds.jpg" className="about-hero-video" aria-hidden="true">
            <source src="/Cover800x312_darken_3mb.mp4" type="video/mp4" />
          </video>
          <div className="about-hero-shade" aria-hidden="true" />
          <div className="about-hero-navigation"><MainNavbar /></div>
          <header className="about-heading">
            <p className="about-eyebrow">STARAVIA</p>
            <h1 id="about-title">{t('About Us')}</h1>
            <div className="about-ornament" aria-hidden="true"><span /><FontAwesomeIcon icon={faStar} /><span /></div>
            <p className="about-subtitle">{t('We turn every flight into a reliable, thoughtful journey.')}</p>
          </header>
        </section>

        <section className="about-introduction" aria-labelledby="about-story-title">
          <div className="about-story">
            <div className="about-photos">
              <img className="about-main-photo" src={BusinessSeat} alt={t('A comfortable premium cabin seat beside an aircraft window')} width="512" height="640" />
              <img className="about-inset-photo" src={FirstClass} alt={t('An inviting first-class cabin with warm interiors')} width="736" height="736" loading="lazy" />
            </div>
            <div className="about-story-copy">
              <span className="about-gold-rule" aria-hidden="true" />
              <h2 id="about-story-title">{t('Comfortable flights, trusted tickets, and heartfelt service')}</h2>
              <p>{t('STARAVIA is a brand specializing in international airline tickets and VIP travel services. We bring comfortable flights, reliable ticketing, and a genuinely warm welcome together in one place.')}</p>
              <p>{t('A business trip, a family holiday, or a well-earned break — we carefully plan every itinerary around your time, budget, and wishes.')}</p>
            </div>
          </div>

          <div className="about-benefits">
            {benefits.map(({ icon, title, description }) => (
              <article className="about-benefit" key={title}>
                <FontAwesomeIcon icon={icon} aria-hidden="true" />
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-mission" aria-labelledby="about-mission-title">
          <div className="about-mission-inner">
            <h2 className="about-eyebrow" id="about-mission-title">{t('Our mission')}</h2>
            <blockquote>{t('“To make international travel easy, reliable, and a personal experience for every passenger.”')}</blockquote>
            <p>{t('For us, every client is a valued guest. From choosing your flight to reaching your destination, our team stays by your side with care, attention, and a sense of responsibility.')}</p>
          </div>
        </section>

        <section className="about-contact" aria-labelledby="about-contact-title">
          <div className="about-contact-inner">
            <div>
              <h2 id="about-contact-title">{t('Let’s plan your next journey together')}</h2>
              <p>{t('Tell us your destination — we’ll take care of the rest.')}</p>
            </div>
            <button type="button" className="about-contact-button" onClick={() => setShowPhonePopup(true)}>
              {t('Get in touch')}<FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
            </button>
          </div>
        </section>
        <Testimonials allowSubmission />
      </main>
      <PhonePopup isOpen={showPhonePopup} onClose={() => setShowPhonePopup(false)} />
    </div>
  )
}
