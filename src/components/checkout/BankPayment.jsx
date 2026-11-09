import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, apiUrl } from '../../lib/api'
import { hostedPaymentUrl, paymentHeaders, paymentIdValid } from '../../lib/payments'
import paymentMessages from './paymentMessages'
import { useLanguage } from '../../i18n/LanguageContext'

export default function BankPayment({ token, result, accepted, billingSaved }) {
  const { language } = useLanguage(), t = paymentMessages[language] || paymentMessages.uz
  const [pending, setPending] = useState(false), [error, setError] = useState(false)
  const busy = useRef(false), navigate = useNavigate()
  const paid = result.paymentStatus === 'paid'
  async function pay() {
    if (busy.current || !accepted || !billingSaved || !result.paymentsEnabled || paid) return
    busy.current = true; setPending(true); setError(false)
    try {
      const key = `payment-request:${token}`
      let requestId = sessionStorage.getItem(key)
      if (!paymentIdValid(requestId)) { requestId = crypto.randomUUID(); sessionStorage.setItem(key, requestId) }
      const response = await apiFetch(apiUrl('/api/payments/create/'), {
        method: 'POST', headers: paymentHeaders(token), cache: 'no-store', referrerPolicy: 'no-referrer',
        body: JSON.stringify({ requestId, termsAccepted: true }),
      })
      const data = await response.json()
      if (!response.ok || !paymentIdValid(data.payment?.id)) throw new Error('Payment unavailable')
      sessionStorage.setItem(`payment-access:${data.payment.id}`, token)
      if (data.payment.checkoutUrl) window.location.assign(hostedPaymentUrl(data.payment.checkoutUrl))
      else navigate(`/payment/pending?payment=${encodeURIComponent(data.payment.id)}`)
    } catch { setError(true) }
    finally { busy.current = false; setPending(false) }
  }
  return <section className="cc-panel cc-payment"><div className="cc-section-title"><span>3</span><div><h2>{t.title}</h2><p>{paid ? t.paid : result.paymentsEnabled ? t.hosted : t.unavailable}</p></div></div>
    {!!result.paymentProvider?.methods?.length && <p>{t.methods}: {result.paymentProvider.methods.join(' · ')}</p>}
    <p>{t.allIncluded}</p>{result.booking.paymentInformation && <div className="cc-agent-payment"><h3>{t.instructions}</h3><p>{result.booking.paymentInformation}</p></div>}{!paid && <><p>{t.requirements}</p><button type="button" disabled={pending || !result.paymentsEnabled || !accepted || !billingSaved} onClick={pay}>{pending ? t.preparing : t.pay}</button></>}
    {paymentIdValid(result.latestPayment?.id) && <p><Link to={`/payment/pending?payment=${result.latestPayment.id}`} onClick={event => { try { sessionStorage.setItem(`payment-access:${result.latestPayment.id}`, token) } catch { event.preventDefault(); setError(true) } }}>{t.check} →</Link></p>}
    <p className="cc-small">{t.issuance}</p>{error && <p className="cc-billing-error" role="alert">{t.error}</p>}
  </section>
}
