import { useEffect, useId, useRef, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import { initialSearch } from './itinerary.mjs'
import '../leads.css'
import './ticket-search.css'

function AirportField({ label, value, onChange, disabled }) {
  const { get } = useFetchClient()
  const id = useId()
  const [airports, setAirports] = useState([])
  useEffect(() => {
    if (value.length < 2) { setAirports([]); return }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await get(`/admin/ticket-search/airports?q=${encodeURIComponent(value)}`, { signal: controller.signal })
        if (!controller.signal.aborted) setAirports(response.data.airports)
      } catch { if (!controller.signal.aborted) setAirports([]) }
    }, 200)
    return () => { clearTimeout(timer); controller.abort() }
  }, [get, value])
  return <label>{label}
    <input value={value} onChange={event => onChange(event.target.value.toUpperCase())} disabled={disabled} list={id} required pattern="[A-Za-z]{3}" maxLength={3} placeholder="TAS" title="Enter a three-letter airport code" />
    <datalist id={id}>{airports.map(airport => <option key={airport.code} value={airport.code}>{airport.city} — {airport.name}</option>)}</datalist>
    <span className="ticket-field-hint">Enter a three-letter IATA code</span>
  </label>
}

function duration(minutes) {
  return typeof minutes === 'number' ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : 'Not provided'
}

export default function TicketSearch({ lead }) {
  const { post } = useFetchClient()
  const [form, setForm] = useState(() => initialSearch(lead))
  const [roundTrip, setRoundTrip] = useState(Boolean(lead?.returnDate))
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const request = useRef(null)
  const busy = useRef(false)
  const today = new Date().toLocaleDateString('en-CA')
  useEffect(() => () => request.current?.abort(), [])

  const change = (key, value) => { setForm(previous => ({ ...previous, [key]: value })); setResult(null); setError('') }
  const search = async event => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    request.current = new AbortController()
    setPending(true); setError(''); setResult(null)
    try {
      const response = await post('/admin/ticket-search/flights', { ...form, passengers: Number(form.passengers), return_date: roundTrip ? form.return_date : undefined }, { signal: request.current.signal })
      if (!request.current.signal.aborted) setResult(response.data)
    } catch (cause) {
      if (!request.current.signal.aborted) setError(cause.response?.status === 403 ? 'Your admin role needs the Ticket Search → Search tickets permission.' : cause.response?.data?.error?.message || 'Ticket search failed. Please try again.')
    } finally {
      busy.current = false
      if (!request.current.signal.aborted) setPending(false)
    }
  }

  return <section className="leads-card ticket-search" id="ticket-search" aria-labelledby="ticket-search-heading">
    <h2 id="ticket-search-heading">Search tickets{lead ? ` · Client ${lead.clientId}` : ''}</h2>
    <p className="ticket-intro">{lead ? 'Prefilled with the travel details supplied by this client. Complete any missing fields before searching.' : 'Search current airline offers with your agency’s configured flight provider.'}</p>
    <form onSubmit={search} className="ticket-search-form">
      <fieldset disabled={pending}>
        <legend className="ticket-legend">Itinerary</legend>
        <label className="ticket-trip-toggle"><input type="checkbox" checked={roundTrip} onChange={event => { setRoundTrip(event.target.checked); setResult(null); setError('') }} />Round trip</label>
        <div className="ticket-fields">
          <AirportField label="From (IATA)" value={form.departure_id} onChange={value => change('departure_id', value)} disabled={pending} />
          <AirportField label="To (IATA)" value={form.arrival_id} onChange={value => change('arrival_id', value)} disabled={pending} />
          <label>Departure date<input type="date" required min={today} value={form.date} onChange={event => change('date', event.target.value)} /></label>
          {roundTrip && <label>Return date<input type="date" required min={form.date || today} value={form.return_date} onChange={event => change('return_date', event.target.value)} /></label>}
          <label>Passengers (adults)<input type="number" required min="1" max="9" step="1" value={form.passengers} onChange={event => change('passengers', event.target.value)} /></label>
          <label>Cabin<select aria-label="Cabin" value={form.cabin} onChange={event => change('cabin', event.target.value)}>{['Economy', 'Premium Economy', 'Business', 'First'].map(cabin => <option key={cabin} value={cabin}>{cabin}</option>)}</select></label>
        </div>
      </fieldset>
      <button type="submit" disabled={pending} className="leads-button">{pending ? 'Searching tickets…' : 'Search tickets'}</button>
    </form>
    {pending && <p role="status" className="ticket-feedback">Searching the flight provider…</p>}
    {error && <p role="alert" className="ticket-error">{error}</p>}
    {result && <div className="ticket-results" aria-live="polite">
      <h3>{result.flights.length} offers · {result.search.departure_id} → {result.search.arrival_id}</h3>
      <p>{result.search.date}{result.search.return_date ? ` — ${result.search.return_date}` : ''} · {result.search.passengers} adult(s) · {result.search.cabin} · USD</p>
      {!result.flights.length && <p className="ticket-feedback">No flights found. Try different dates, airports, or cabin.</p>}
      {result.flights.map(flight => <article className="ticket-offer" key={flight.id}>
        <header><h4>{flight.airline}</h4><strong>{flight.price === null ? 'Price unavailable' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(flight.price)}</strong></header>
        <p>{flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop(s)`} · {duration(flight.duration)} · {flight.cabin}</p>
        <ol>{flight.legs.map((leg, index) => <li key={index}>
          <strong>{leg.departure.code} → {leg.arrival.code}</strong>
          <span>{leg.departure.time || 'Time unavailable'} → {leg.arrival.time || 'Time unavailable'}</span>
          <span>{leg.airline} {leg.flightNumber} · {duration(leg.duration)}</span>
        </li>)}</ol>
      </article>)}
      <p className="ticket-disclaimer">Provider prices are in USD for the selected search. Confirm fare rules, passenger totals, and availability before quoting or issuing a ticket. {result.search.return_date && 'Round-trip search initially shows outbound options; return-flight selection and final booking must be confirmed with the provider.'} This search does not issue tickets or charge the client.</p>
    </div>}
  </section>
}
