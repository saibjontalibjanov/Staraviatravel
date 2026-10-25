import { useEffect, useId, useRef, useState } from 'react'
import { apiUrl } from '../../lib/api'
export default function BillingContact({ token, booking, t }) {
  const phoneId = useId()
  const [form, setForm] = useState(() => ({
    fullName: booking.passengerDetails[0].fullName,
    email: '',
    prefix: '+998',
    phone: '',
    country: 'Uzbekistan',
    city: '',
    address: '',
  }))
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const request = useRef(null)
  const busy = useRef(false)
  useEffect(() => () => request.current?.abort(), [])
  const change = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }))
    setSaved(false)
    setError('')
  }
  const submit = async (event) => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setSaved(false)
    request.current = new AbortController()
    try {
      const response = await fetch(apiUrl(`/api/checkouts/${encodeURIComponent(token)}/billing`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: request.current.signal,
        body: JSON.stringify({ ...form, phone: `${form.prefix}${form.phone.replace(/\D/g, '')}` }),
      })
      if (!response.ok) throw new Error('save failed')
      const data = await response.json()
      if (data.saved !== true) throw new Error('save failed')
      setSaved(true)
    } catch (cause) {
      if (!request.current.signal.aborted) setError(t.billingError)
    } finally {
      busy.current = false
      if (!request.current.signal.aborted) setPending(false)
    }
  }
  return (
    <section className="cc-panel">
      <div className="cc-section-title">
        <span>1</span>
        <div>
          <h2>{t.billing}</h2>
          <p>{t.billingSub}</p>
        </div>
      </div>
      <form onSubmit={submit} className="cc-billing-form">
        <fieldset disabled={pending}>
          <div className="cc-billing-fields">
            <label className="cc-field-full">
              {t.fullName}
              {booking.passengerDetails.length > 1 ? (
                <select value={form.fullName} onChange={(e) => change('fullName', e.target.value)}>
                  {booking.passengerDetails.map((person) => (
                    <option key={person.id}>{person.fullName}</option>
                  ))}
                </select>
              ) : (
                <input readOnly value={form.fullName} autoComplete="name" />
              )}
              <small>{t.nameHint}</small>
            </label>
            <label>
              {t.email}
              <input
                type="email"
                autoComplete="email"
                required
                maxLength="254"
                value={form.email}
                onChange={(e) => change('email', e.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <div className="cc-phone-label">
              <label htmlFor={phoneId}>{t.phone}</label>
              <div className="cc-phone-fields">
                <select
                  aria-label={t.callingCode}
                  value={form.prefix}
                  onChange={(e) => change('prefix', e.target.value)}
                >
                  {['+998', '+7', '+1', '+44', '+971'].map((prefix) => (
                    <option key={prefix}>{prefix}</option>
                  ))}
                </select>
                <input
                  id={phoneId}
                  type="tel"
                  autoComplete="tel-national"
                  required
                  pattern="[0-9 ()-]{6,20}"
                  value={form.phone}
                  onChange={(e) => change('phone', e.target.value)}
                  placeholder="90 123 45 67"
                />
              </div>
            </div>
            <label>
              {t.country}
              <input
                required
                maxLength="80"
                autoComplete="country-name"
                value={form.country}
                onChange={(e) => change('country', e.target.value)}
              />
            </label>
            <label>
              {t.city}
              <input
                required
                maxLength="100"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => change('city', e.target.value)}
              />
            </label>
            <label className="cc-field-full">
              {t.address}
              <input
                required
                maxLength="300"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => change('address', e.target.value)}
              />
            </label>
          </div>
          <button type="submit" className="cc-save-billing">
            {pending ? t.saving : t.saveBilling}
          </button>
        </fieldset>
      </form>
      {error && (
        <p className="cc-billing-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="cc-billing-success" role="status">
          {t.billingSaved}
        </p>
      )}
    </section>
  )
}
