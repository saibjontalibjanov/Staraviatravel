import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import messages from '../components/checkout/messages'
import './Checkout.css'

export default function Checkout() {
  const { token } = useParams()
  const { language, setLanguage, locale } = useLanguage()
  const t = messages[language] || messages.uz
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [accepted, setAccepted] = useState(false)
  const [, tick] = useState(0)
  const languageSetter = useRef(setLanguage)
  languageSetter.current = setLanguage
  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex, nofollow'; document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading'); setResult(null); setAccepted(false)
    if (!/^[A-Za-z0-9_-]{43}$/.test(token || '')) { setStatus('unavailable'); return () => controller.abort() }
    fetch(apiUrl(`/api/checkouts/${encodeURIComponent(token)}`), { signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' })
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 404 ? 'unavailable' : 'error')
        const data = await response.json()
        if (!data.booking || !/^\d+$/.test(data.amountMinor) || !['USD', 'UZS'].includes(data.currency) || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error('error')
        if (!controller.signal.aborted) { setResult(data); languageSetter.current(data.booking.language); setStatus('ready') }
      })
      .catch(error => { if (!controller.signal.aborted) setStatus(error.message === 'unavailable' ? 'unavailable' : 'error') })
    return () => controller.abort()
  }, [token, attempt])
  useEffect(() => {
    if (!result) return
    const timer = setInterval(() => tick(value => value + 1), 1000)
    return () => clearInterval(timer)
  }, [result])
  const expired = result && new Date(result.expiresAt).getTime() <= Date.now()
  const booking = result?.booking
  const money = result && new Intl.NumberFormat(locale, { style: 'currency', currency: result.currency }).format(Number(result.amountMinor) / 100)
  const date = value => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
  const cabin = value => ({ Economy: t.economy, 'Premium Economy': t.premium, Business: t.business, First: t.first }[value] || value)
  return <div className="client-checkout">
    <header className="cc-header"><div className="cc-header-inner"><Link className="cc-brand" to="/"><span>✦</span> StarAviaTravel</Link><div className="cc-header-actions"><span className="cc-private">♧ {t.private}</span><select aria-label="Language" value={language} onChange={e => setLanguage(e.target.value)}><option value="uz">O‘zbekcha</option><option value="ru">Русский</option><option value="en">English</option></select></div></div><div className="cc-progress"><span>✓</span><p>{t.protected}</p><i /><span>2</span><p>{t.payment}</p></div></header>
    <main className="cc-main">
      <p className="cc-eyebrow">{t.step}</p><h1>{t.title}</h1><p className="cc-subtitle">{t.subtitle}</p>
      {status === 'loading' ? <p className="cc-state" role="status">{t.loading}</p> : status !== 'ready' || expired ? <section className="cc-panel cc-state" role="alert"><h2>{t.unavailable}</h2><p>{t.invalid}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>{t.retry}</button><Link to="/">{t.home} →</Link></section> : <div className="cc-grid">
        <div className="cc-content"><div className="cc-notice">♧ <span>{t.noCharge}</span></div>
          <section className="cc-panel"><div className="cc-section-title"><span>1</span><div><h2>{t.contact}</h2><p>{t.contactSub}</p></div></div><dl className="cc-details">{[[t.passenger, booking.passengerName], [t.passengers, booking.passengers], [t.cabin, cabin(booking.cabin)], ...(booking.airline ? [[t.airline, booking.airline]] : [])].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
          <section className="cc-panel"><div className="cc-section-title"><span>2</span><div><h2>{t.terms}</h2><p>{t.termsSub}</p></div></div><p className="cc-fare-terms">{booking.fareTerms}</p><label className="cc-accept"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />{t.accept}</label></section>
          <section className="cc-panel cc-payment"><div className="cc-section-title"><span>3</span><div><h2>{t.payment}</h2><p>{t.paymentSub}</p></div></div><div className="cc-payment-placeholder" aria-hidden="true"><span>▣</span><span>VISA</span><span>Mastercard</span><span>UZCARD</span><span>HUMO</span></div><p>{t.note}</p><button type="button" disabled>{t.pending}</button><p className="cc-small">{t.noCharge}</p></section>
        </div>
        <aside className="cc-summary cc-panel" aria-label={t.booking}><p className="cc-eyebrow">{t.booking}</p><h2>{booking.route}</h2><div className="cc-flight"><p>{t.outbound}</p><strong>{date(booking.departureDate)}</strong><span>✈ {booking.route}</span>{booking.airline && <small>{booking.airline} · {cabin(booking.cabin)}</small>}</div>{booking.returnDate && <div className="cc-flight"><p>{t.return}</p><strong>{date(booking.returnDate)}</strong><small>{cabin(booking.cabin)}</small></div>}<dl className="cc-summary-details"><div><dt>{t.passenger}</dt><dd>{booking.passengerName}</dd></div><div><dt>{t.passengers}</dt><dd>{booking.passengers}</dd></div></dl><div className="cc-total"><div><p>{t.total} · {result.currency}</p><small>{t.included}</small></div><strong>{money}</strong></div><p className="cc-valid">{t.valid}<br /><strong>{new Date(result.expiresAt).toLocaleString(locale)}</strong></p><p className="cc-small">♧ {t.secure}</p></aside>
      </div>}
    </main><footer className="cc-footer">© {new Date().getFullYear()} StarAviaTravel · {t.footer}</footer>
  </div>
}
