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

export default function TicketSearch({ lead, onSelectFare }) {
  const { post } = useFetchClient()
  const [form, setForm] = useState(() => initialSearch(lead))
  const [tripType, setTripType] = useState(lead?.returnDate ? 'round-trip' : 'one-way')
  const [multiCity, setMultiCity] = useState([{departure_id:lead?.departureAirport || '',arrival_id:lead?.arrivalAirport || '',date:lead?.departureDate || ''},{departure_id:lead?.arrivalAirport || '',arrival_id:'',date:lead?.returnDate || ''}])
  const [selected, setSelected] = useState(null)
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
      const response = await post('/admin/ticket-search/flights', { ...form, clientId: lead?.clientId, passengers: Number(form.passengers), return_date: tripType==='round-trip' ? form.return_date : undefined, ...(tripType==='multi-city'?{tripType,multiCity}:{}) }, { signal: request.current.signal })
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
        <label>Trip type<select value={tripType} onChange={event=>{setTripType(event.target.value);setResult(null);setError('')}}><option value="one-way">One way</option><option value="round-trip">Round trip</option><option value="multi-city">Multi-city</option></select></label>
        <div className="ticket-fields">
          {tripType!=='multi-city' && <>
          <AirportField label="From (IATA)" value={form.departure_id} onChange={value => change('departure_id', value)} disabled={pending} />
          <AirportField label="To (IATA)" value={form.arrival_id} onChange={value => change('arrival_id', value)} disabled={pending} />
          <label>Departure date<input type="date" required min={today} value={form.date} onChange={event => change('date', event.target.value)} /></label>
          {tripType==='round-trip' && <label>Return date<input type="date" required min={form.date || today} value={form.return_date} onChange={event => change('return_date', event.target.value)} /></label>}
          </>}
          {tripType==='multi-city'&&multiCity.map((journey,index)=><div key={index}><h3>Journey {index+1}</h3>{[['departure_id','From (IATA)'],['arrival_id','To (IATA)']].map(([key,label])=><AirportField key={key} label={`${label} · journey ${index+1}`} value={journey[key]} onChange={value=>{setMultiCity(previous=>previous.map((item,i)=>i===index?{...item,[key]:value}:item));setResult(null)}} disabled={pending} />)}<label>Departure date · journey {index+1}<input type="date" required min={index?multiCity[index-1].date || today:today} value={journey.date} onChange={event=>{setMultiCity(previous=>previous.map((item,i)=>i===index?{...item,date:event.target.value}:item));setResult(null)}} /></label></div>)}
          <label>Passengers (adults)<input type="number" required min="1" max="9" step="1" value={form.passengers} onChange={event => change('passengers', event.target.value)} /></label>
          <label>Cabin<select aria-label="Cabin" value={form.cabin} onChange={event => change('cabin', event.target.value)}>{['Economy', 'Premium Economy', 'Business', 'First'].map(cabin => <option key={cabin} value={cabin}>{cabin}</option>)}</select></label>
        </div>
        {tripType==='multi-city'&&<div className="checkout-admin-buttons"><button className="leads-button" type="button" disabled={multiCity.length>=6} onClick={()=>{setMultiCity(previous=>[...previous,{departure_id:previous.at(-1).arrival_id,arrival_id:'',date:previous.at(-1).date}]);setResult(null)}}>Add city</button><button className="leads-button" type="button" disabled={multiCity.length<=2} onClick={()=>{setMultiCity(previous=>previous.slice(0,-1));setResult(null)}}>Remove last city</button></div>}
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
        {onSelectFare&&<button type="button" className="leads-button" disabled={!flight.quoteReference} onClick={()=>{onSelectFare({flight,search:result.search});setSelected(flight.quoteReference);document.getElementById('checkout-heading')?.scrollIntoView({behavior:'smooth',block:'start'})}}>{selected===flight.quoteReference?'Selected for checkout ✓':'Use this fare for checkout'}</button>}
      </article>)}
      <p className="ticket-disclaimer">Provider prices are in USD for the selected search. Confirm fare rules, passenger totals, and availability before quoting or issuing a ticket. {result.search.return_date && 'Round-trip search initially shows outbound options; return-flight selection and final booking must be confirmed with the provider.'} Missing journey details, terminals and baggage must be verified and completed by the agent in the checkout editor. This search does not issue tickets or charge the client.</p>
    </div>}
  </section>
}
