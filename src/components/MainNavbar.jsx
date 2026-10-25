import { useEffect, useId, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const links = [
  { to: '/', label: 'HOME' },
  { to: '/business-class', label: 'BUSINESS CLASS' },
  { to: '/#biz-haqimizda', label: 'HOW TO BOOK' },
  { to: '/#fikrlar', label: 'TESTIMONIALS' },
  { to: '/about-us', label: 'ABOUT US' },
]

export default function MainNavbar() {
  const { t } = useLanguage()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => { setOpen(false) }, [location.pathname, location.hash])

  useEffect(() => {
    if (!open) return
    const close = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  const followLink = (event, to) => {
    setOpen(false)
    if (to === location.pathname + location.hash && location.hash) {
      event.preventDefault()
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return <header className="relative z-50 flex items-center justify-between gap-4 px-6 py-6 md:px-12 lg:px-8">
    <nav aria-label={t('Main navigation')} className="hidden lg:flex flex-wrap items-center gap-5 xl:gap-10 text-sm xl:text-[15px] font-medium text-white/90">
      {links.map(link => <Link key={link.to} to={link.to} onClick={event => followLink(event, link.to)} aria-current={link.to === location.pathname && !location.hash ? 'page' : undefined} className="relative transition-colors duration-300 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold after:transition-all hover:after:w-full">{t(link.label)}</Link>)}
    </nav>
    <button type="button" onClick={() => setOpen(value => !value)} aria-label={t(open ? 'Close navigation' : 'Open navigation')} aria-expanded={open} aria-controls={menuId} className="lg:hidden text-white p-2 rounded-lg bg-black/30 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
      <svg aria-hidden="true" className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} /></svg>
    </button>
    {open && <nav id={menuId} aria-label={t('Mobile navigation')} className="absolute top-full left-4 right-4 rounded-2xl bg-ink/95 backdrop-blur-md flex flex-col gap-4 p-6 shadow-2xl lg:hidden">
      {links.map(link => <Link key={link.to} to={link.to} onClick={event => followLink(event, link.to)} aria-current={link.to === location.pathname && !location.hash ? 'page' : undefined} className="text-white text-base font-medium hover:text-gold border-b border-white/10 pb-3">{t(link.label)}</Link>)}
      <a href="tel:+998901234567" className="rounded-xl bg-gold px-6 py-3 text-center font-medium text-ink">+998 90 123 45 67</a>
    </nav>}
  </header>
}
