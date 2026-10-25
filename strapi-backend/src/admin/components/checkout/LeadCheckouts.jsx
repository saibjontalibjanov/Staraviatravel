import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import './checkout-admin.css'

export default function LeadCheckouts({ lead }) {
  const { get, post } = useFetchClient()
  const [form, setForm] = useState(() => ({
    route: lead.flightRoute || [lead.departureAirport, lead.arrivalAirport].filter(Boolean).join(' → '),
    airline: lead.airline || '', passengerName: [lead.firstName, lead.lastName].filter(Boolean).join(' '),
    departureDate: lead.departureDate || '', returnDate: lead.returnDate || '',
    passengers: lead.passengers || 1, cabin: lead.cabin || 'Economy',
    amount: lead.quotedPrice == null ? '' : String(lead.quotedPrice), currency: 'USD',
    expiryDays: 7, language: lead.language || 'uz', fareTerms: '',
  }))
  const [checkouts, setCheckouts] = useState([])
  const [error, setError] = useState('')
  const [configurationError, setConfigurationError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [created, setCreated] = useState(null)
  const busy = useRef(false)
  const requestId = useRef(null)
  const url = `/admin/lead-checkouts/${lead.clientId}`
  const message = cause => cause.response?.status === 403 ? 'Your role needs Checkout → Create and revoke checkout links, and read access to Leads.' : cause.response?.data?.error?.message || 'Could not save or load checkout links. Please retry.'
  const load = useCallback(async signal => {
    try {
      const response = await get(url, { signal })
      if (!signal?.aborted) { setCheckouts(response.data.checkouts); setConfigurationError(response.data.configurationError || '') }
    } catch (cause) { if (!signal?.aborted) setError(message(cause)) }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [get, url])
  useEffect(() => { const controller = new AbortController(); load(controller.signal); return () => controller.abort() }, [load])
  const change = (key, value) => { setForm(previous => ({ ...previous, [key]: value })); requestId.current = null; setNotice('') }
  const create = async event => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true; setPending(true); setError(''); setNotice('')
    requestId.current ||= crypto.randomUUID()
    try {
      const response = await post(url, { ...form, passengers: Number(form.passengers), expiryDays: Number(form.expiryDays), requestId: requestId.current })
      setCreated(response.data.checkout); requestId.current = null
      setNotice('Checkout created. Copy the private link below and send it to this client.')
      await load()
    } catch (cause) { setError(message(cause)) }
    finally { busy.current = false; setPending(false) }
  }
  const revoke = async id => {
    if (busy.current) return
    busy.current = true; setPending(true); setError('')
    try {
      await post(`${url}/${id}/revoke`)
      if (created?.id === id) setCreated(null)
      setNotice('Checkout link revoked. The client can no longer open it.'); await load()
    } catch (cause) { setError(message(cause)) }
    finally { busy.current = false; setPending(false) }
  }
  const copy = async link => {
    try { await navigator.clipboard.writeText(link); setNotice('Checkout link copied.') }
    catch { setNotice('Select the link field and copy it manually.') }
  }
  return <section className="leads-card lead-checkouts" aria-labelledby="checkout-heading">
    <h2 id="checkout-heading">Client checkout pages</h2>
    <p>Create a private checkout for this lead. Booking details are prefilled; confirm the final itinerary, total and fare rules. Payments are awaiting provider setup.</p>
    {configurationError && <p role="alert" className="checkout-admin-error">{configurationError}</p>}
    <form onSubmit={create}>
      <fieldset disabled={pending || Boolean(configurationError)}>
        <legend>Create checkout</legend>
        <div className="checkout-admin-fields">
          <label>Route<input required maxLength="200" value={form.route} onChange={e => change('route', e.target.value)} placeholder="Tashkent → Dubai" /></label>
          <label>Airline<input maxLength="100" value={form.airline} onChange={e => change('airline', e.target.value)} /></label>
          <label>Passenger / booking name<input required maxLength="200" value={form.passengerName} onChange={e => change('passengerName', e.target.value)} /></label>
          <label>Passengers<input type="number" required min="1" max="9" value={form.passengers} onChange={e => change('passengers', e.target.value)} /></label>
          <label>Departure date<input type="date" required min={new Date().toLocaleDateString('en-CA')} value={form.departureDate} onChange={e => change('departureDate', e.target.value)} /></label>
          <label>Return date (optional)<input type="date" min={form.departureDate} value={form.returnDate} onChange={e => change('returnDate', e.target.value)} /></label>
          <label>Cabin<select value={form.cabin} onChange={e => change('cabin', e.target.value)}>{['Economy', 'Premium Economy', 'Business', 'First'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Total amount (all taxes and fees)<input type="number" required min="0.01" max="999999999.99" step="0.01" value={form.amount} onChange={e => change('amount', e.target.value)} /></label>
          <label>Currency<select value={form.currency} onChange={e => change('currency', e.target.value)}><option>USD</option><option>UZS</option></select></label>
          <label>Link valid for (days)<input type="number" min="1" max="30" required value={form.expiryDays} onChange={e => change('expiryDays', e.target.value)} /></label>
          <label>Client language<select value={form.language} onChange={e => change('language', e.target.value)}><option value="uz">O‘zbekcha</option><option value="ru">Русский</option><option value="en">English</option></select></label>
          <label className="checkout-admin-wide">Fare and refund terms (in the client’s language)<textarea required maxLength="5000" rows="5" value={form.fareTerms} onChange={e => change('fareTerms', e.target.value)} placeholder="Enter the actual airline change, cancellation, baggage and refund conditions. These are shown to the client." /></label>
        </div>
        <button className="leads-button" type="submit">{pending ? 'Saving…' : 'Create checkout & generate link'}</button>
      </fieldset>
    </form>
    {error && <p role="alert" className="checkout-admin-error">{error}</p>}
    {notice && <p role="status" className="checkout-admin-notice">{notice}</p>}
    {created?.url && <div className="checkout-admin-created"><h3>New client checkout link</h3><input aria-label="New checkout link" readOnly value={created.url} onFocus={e => e.target.select()} /><button className="leads-button" onClick={() => copy(created.url)}>Copy link</button><a href={created.url} target="_blank" rel="noreferrer">Preview client page ↗</a></div>}
    <h3>Checkout history</h3>
    <p>Links are private: anyone with a link can see its booking details. Keep them within this client’s conversation. To change an offer, revoke its link and create a new checkout.</p>
    <button type="button" className="leads-button" disabled={pending} onClick={() => { setError(''); load() }}>Refresh links</button>
    {loading ? <p role="status">Loading checkouts…</p> : !checkouts.length ? <p>No checkout pages created yet.</p> : checkouts.map(item => <article className="checkout-admin-item" key={item.id}>
      <h4>{item.snapshot.route} · {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(Number(item.amountMinor) / 100)}</h4>
      <p>{item.status} · Expires {new Date(item.expiresAt).toLocaleString()}</p>
      {item.url && <><input readOnly aria-label={`Checkout ${item.id} link`} value={item.url} onFocus={e => e.target.select()} /><div className="checkout-admin-buttons"><button className="leads-button" onClick={() => copy(item.url)}>Copy link</button><a href={item.url} target="_blank" rel="noreferrer">Open checkout ↗</a><button className="leads-button" disabled={pending} onClick={() => revoke(item.id)}>Revoke link</button></div></>}
    </article>)}
  </section>
}
