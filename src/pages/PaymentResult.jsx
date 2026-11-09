import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch, apiUrl } from '../lib/api'
import { paymentHeaders, paymentIdValid, paymentPresentation } from '../lib/payments'
import paymentMessages from '../components/checkout/paymentMessages'
import { useLanguage } from '../i18n/LanguageContext'
import './Checkout.css'

export default function PaymentResult() {
  const [params] = useSearchParams(), id = params.get('payment')
  const { language, locale } = useLanguage(), t = paymentMessages[language] || paymentMessages.uz
  const [payment, setPayment] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  let token = ''
  try { if (paymentIdValid(id)) token = sessionStorage.getItem(`payment-access:${id}`) || '' } catch { /* no browser capability */ }
  const accessible = /^[A-Za-z0-9_-]{43}$/.test(token)
  useEffect(() => {
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.appendChild(meta)
    return () => meta.remove()
  }, [])
  useEffect(() => {
    setPayment(null)
    if (!accessible) return
    const controller = new AbortController()
    setBusy(true); setError(false)
    const base = apiUrl(`/api/payments/status/${encodeURIComponent(id)}/`)
    async function check() {
      // Server state is authoritative. URL path (even /success) never decides status.
      const read = await apiFetch(base, { headers: paymentHeaders(token), signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' })
      const current = await read.json()
      if (!read.ok || current.payment?.id !== id) throw new Error('Unavailable')
      if (!controller.signal.aborted) setPayment(current.payment)
      if (current.payment.status !== 'succeeded') {
        const verified = await apiFetch(`${base}verify/`, { method: 'POST', headers: paymentHeaders(token), body: '{}', signal: controller.signal, cache: 'no-store', referrerPolicy: 'no-referrer' })
        const data = await verified.json()
        if (!verified.ok || data.payment?.id !== id) throw new Error('Verification failed')
        if (!controller.signal.aborted) setPayment(data.payment)
      }
    }
    check().catch(() => { if (!controller.signal.aborted) setError(true) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [id, token, accessible, attempt])
  const state = paymentPresentation(payment)
  useEffect(() => {
    if (payment?.verifiedAt && ['failed','cancelled','expired'].includes(state)) {
      try { sessionStorage.removeItem(`payment-request:${token}`) } catch { /* keep safe idempotent fallback */ }
    }
  }, [payment, state, token])
  return <div className="client-checkout"><header className="cc-header"><div className="cc-header-inner"><Link className="cc-brand" to="/">✦ StarAviaTravel</Link></div></header><main className="cc-main"><p className="cc-eyebrow">STARAVIA TRAVEL</p><h1>{t.title}</h1><section className="cc-panel cc-payment-result" aria-live="polite"><h2>{accessible ? t[state] : t.unverified}</h2>
    {!accessible ? <p>{t.noAccess}</p> : <>{payment && <p>{new Intl.NumberFormat(locale, { style: 'currency', currency: payment.currency }).format(Number(payment.amountMinor) / 100)}</p>}{state === 'succeeded' && <p>{t.paid}</p>}<p>{t.issuance}</p>{error && <p role="alert" className="cc-billing-error">{t.error}</p>}<button type="button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>{busy ? t.checking : t.check}</button><p><Link to={`/checkout/${token}`}>{t.back}</Link></p></>}
    <Link to="/">{t.home} →</Link></section></main></div>
}
