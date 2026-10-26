import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetchClient } from '@strapi/strapi/admin'
import JourneyEditor from './JourneyEditor'
import { emptyLeg, fromOffer, pricePreview } from './itinerary.mjs'
import './checkout-admin.css'

export default function LeadCheckouts({ lead, passports = [], selectedFare }) {
  const { get, post } = useFetchClient()
  const [form, setForm] = useState(() => ({
    route: lead.flightRoute || '',
    tripType: lead.returnDate ? 'round-trip' : 'one-way',
    journeys: [
      { legs: [emptyLeg(lead)] },
      ...(lead.returnDate
        ? [
            {
              legs: [
                {
                  ...emptyLeg(lead),
                  from: lead.arrivalAirport || '',
                  to: lead.departureAirport || '',
                  departureDate: lead.returnDate,
                  arrivalDate: lead.returnDate,
                },
              ],
            },
          ]
        : []),
    ],
    baggage: [],
    currency: 'USD',
    profit: '0.00',
    exchangeRate: '',
    expiryDays: 7,
    language: lead.language || 'uz',
    fareTerms: '',
    paymentInformation: '',
    fareConfirmed: false,
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
  const message = (cause) =>
    cause.response?.status === 403
      ? 'Your role needs Checkout → Create and revoke checkout links, and read access to Leads.'
      : cause.response?.data?.error?.message ||
        'Could not save or load checkout links. Please retry.'
  const load = useCallback(
    async (signal) => {
      try {
        const response = await get(url, { signal })
        if (!signal?.aborted) {
          setCheckouts(response.data.checkouts)
          setConfigurationError(response.data.configurationError || '')
        }
      } catch (cause) {
        if (!signal?.aborted) setError(message(cause))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [get, url],
  )
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])
  useEffect(() => {
    if (!selectedFare) return
    setForm((previous) => ({
      ...previous,
      ...fromOffer(selectedFare, lead),
      currency: 'USD',
      exchangeRate: '',
      fareConfirmed: false,
    }))
    requestId.current = null
    setNotice(
      'Fare selected. Review every flight segment, add any missing return/multi-city flights, baggage, and profit before generating the link.',
    )
  }, [selectedFare])
  const change = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
      ...(key !== 'fareConfirmed' ? { fareConfirmed: false } : {}),
    }))
    requestId.current = null
    setNotice('')
  }
  const setTripType = (value) => {
    setForm((previous) => {
      let journeys = previous.journeys
      if (value === 'one-way') journeys = journeys.slice(0, 1)
      else if (journeys.length < 2) {
        const first = journeys[0].legs[0]
        const last = journeys[0].legs.at(-1)
        journeys = [
          ...journeys,
          {
            legs: [
              {
                ...emptyLeg(),
                from: last.to,
                to: first.from,
                fromCity: last.toCity,
                toCity: first.fromCity,
                cabin: last.cabin,
              },
            ],
          },
        ]
      }
      return {
        ...previous,
        tripType: value,
        journeys: value === 'round-trip' ? journeys.slice(0, 2) : journeys,
        fareConfirmed: false,
      }
    })
    requestId.current = null
  }
  const create = async (event) => {
    event.preventDefault()
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setNotice('')
    requestId.current ||= crypto.randomUUID()
    try {
      const response = await post(url, {
        ...form,
        quoteReference: selectedFare?.flight.quoteReference,
        expiryDays: Number(form.expiryDays),
        requestId: requestId.current,
      })
      setCreated(response.data.checkout)
      requestId.current = null
      setNotice('Checkout created. Copy this private link and send it to the client.')
      await load()
    } catch (cause) {
      setError(message(cause))
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const revoke = async (id) => {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await post(`${url}/${id}/revoke`)
      if (created?.id === id) setCreated(null)
      setNotice('Checkout link revoked.')
      await load()
    } catch (cause) {
      setError(message(cause))
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      setNotice('Checkout link copied.')
    } catch {
      setNotice('Select the link field and copy it manually.')
    }
  }
  const pricing = pricePreview(
    selectedFare?.flight.price,
    form.currency,
    form.exchangeRate,
    form.profit,
  )
  const money = (value, currency = form.currency) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
  return (
    <section className="leads-card lead-checkouts" aria-labelledby="checkout-heading">
      <h2 id="checkout-heading">Client checkout pages</h2>
      <p>
        Select a ticket-search fare above, confirm the flight details, and add your private profit.
        Only the final total is sent to the client.
      </p>
      {configurationError && (
        <p role="alert" className="checkout-admin-error">
          {configurationError}
        </p>
      )}
      {!passports.length && (
        <p className="checkout-admin-error">Save Passport Details before creating a checkout.</p>
      )}
      <div className="checkout-private-price">
        <h3>Selected fare & private profit · agents only</h3>
        {selectedFare ? (
          <>
            <p>
              <strong>
                {selectedFare.flight.airline} · {selectedFare.flight.flightNumber}
              </strong>
              <br />
              Ticket-search fare: {money(selectedFare.flight.price, 'USD')} · Quote expires{' '}
              {new Date(selectedFare.flight.quoteExpiresAt).toLocaleString()}
            </p>
            <p>
              Passenger names:{' '}
              {passports.map((person) => person.fullName).join(', ') || 'No saved passport details'}
            </p>
          </>
        ) : (
          <p>
            No fare selected. Use “Use this fare for checkout” on a priced ticket-search result.
          </p>
        )}
      </div>
      <form onSubmit={create}>
        <fieldset disabled={pending || Boolean(configurationError)}>
          <legend>Booking & payment information</legend>
          <div className="checkout-admin-fields">
            <label>
              Route shown to the client
              <input
                required
                maxLength="200"
                value={form.route}
                onChange={(e) => change('route', e.target.value)}
                placeholder="Tashkent ⇄ Dubai"
              />
            </label>
            <label>
              Checkout trip type
              <select value={form.tripType} onChange={(e) => setTripType(e.target.value)}>
                <option value="one-way">One way</option>
                <option value="round-trip">Round trip</option>
                <option value="multi-city">Multi-city</option>
              </select>
            </label>
            <label>
              Client currency
              <select value={form.currency} onChange={(e) => change('currency', e.target.value)}>
                <option>USD</option>
                <option>UZS</option>
              </select>
            </label>
            {form.currency === 'UZS' && (
              <label>
                Verified exchange rate · UZS per 1 USD
                <input
                  required
                  inputMode="decimal"
                  value={form.exchangeRate}
                  onChange={(e) => change('exchangeRate', e.target.value)}
                  placeholder="Enter your actual rate"
                />
              </label>
            )}
            <label>
              Private profit ({form.currency}) · never visible to client
              <input
                type="number"
                min="0"
                max="999999999.99"
                step="0.01"
                required
                value={form.profit}
                onChange={(e) => change('profit', e.target.value)}
              />
            </label>
            <label>
              Link valid for (days)
              <input
                type="number"
                min="1"
                max="30"
                required
                value={form.expiryDays}
                onChange={(e) => change('expiryDays', e.target.value)}
              />
            </label>
            <label>
              Client language
              <select value={form.language} onChange={(e) => change('language', e.target.value)}>
                <option value="uz">O‘zbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
          {pricing && (
            <div className="checkout-private-price">
              <p>
                Agent cost: {money(pricing.base)} · Private profit: {money(pricing.profit)}
              </p>
              <strong>Client total: {money(pricing.total)}</strong>
              <p>
                The checkout response contains only the total. No fare-cost or profit breakdown is
                shared.
              </p>
            </div>
          )}
          <JourneyEditor
            tripType={form.tripType}
            journeys={form.journeys}
            onChange={(value) => change('journeys', value)}
          />
          <h3>Baggage allowances</h3>
          <p>Add only the allowance verified for this fare. No baggage entitlement is invented.</p>
          {form.baggage.map((item, index) => (
            <div className="checkout-admin-baggage" key={index}>
              <div className="checkout-admin-fields">
                <label>
                  Baggage type
                  <select
                    value={item.type}
                    onChange={(e) =>
                      change(
                        'baggage',
                        form.baggage.map((entry, i) =>
                          i === index ? { ...entry, type: e.target.value } : entry,
                        ),
                      )
                    }
                  >
                    <option value="checked">Checked</option>
                    <option value="cabin">Cabin</option>
                    <option value="personal">Personal item</option>
                  </select>
                </label>
                <label>
                  Allowance
                  <input
                    required
                    maxLength="200"
                    value={item.allowance}
                    onChange={(e) =>
                      change(
                        'baggage',
                        form.baggage.map((entry, i) =>
                          i === index ? { ...entry, allowance: e.target.value } : entry,
                        ),
                      )
                    }
                    placeholder="1 piece · 23 kg"
                  />
                </label>
                <label>
                  Applies to
                  <input
                    required
                    maxLength="200"
                    value={item.appliesTo}
                    onChange={(e) =>
                      change(
                        'baggage',
                        form.baggage.map((entry, i) =>
                          i === index ? { ...entry, appliesTo: e.target.value } : entry,
                        ),
                      )
                    }
                    placeholder="Each passenger · all flights"
                  />
                </label>
              </div>
              <button
                type="button"
                className="leads-button"
                onClick={() =>
                  change(
                    'baggage',
                    form.baggage.filter((_, i) => i !== index),
                  )
                }
              >
                Remove baggage
              </button>
            </div>
          ))}
          <div className="checkout-admin-buttons">
            {[
              ['checked', 'Add checked baggage'],
              ['cabin', 'Add cabin baggage'],
              ['personal', 'Add personal item'],
            ].map(([type, label]) => (
              <button
                type="button"
                className="leads-button"
                key={type}
                disabled={form.baggage.length >= 20}
                onClick={() =>
                  change('baggage', [...form.baggage, { type, allowance: '', appliesTo: '' }])
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="checkout-admin-fields">
            <label className="checkout-admin-wide">
              Fare and refund terms (in the client’s language)
              <textarea
                required
                maxLength="5000"
                rows="5"
                value={form.fareTerms}
                onChange={(e) => change('fareTerms', e.target.value)}
              />
            </label>
            <label className="checkout-admin-wide">
              Payment information shown to the client
              <textarea
                maxLength="2000"
                rows="3"
                value={form.paymentInformation}
                onChange={(e) => change('paymentInformation', e.target.value)}
                placeholder="Client-facing payment arrangements or instructions. Do not enter profit, internal costs, or card details here."
              />
            </label>
          </div>
          <label className="checkout-admin-confirm">
            <input
              type="checkbox"
              required
              checked={form.fareConfirmed}
              onChange={(e) => change('fareConfirmed', e.target.checked)}
            />
            I verified this selected fare and final total cover all saved passport passengers,
            flight segments and baggage shown here.
          </label>
          <button
            className="leads-button"
            type="submit"
            disabled={!selectedFare || !passports.length || !pricing}
          >
            {pending ? 'Saving…' : 'Create checkout & generate link'}
          </button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="checkout-admin-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="checkout-admin-notice">
          {notice}
        </p>
      )}
      {created?.url && (
        <div className="checkout-admin-created">
          <h3>New client checkout link</h3>
          <input
            aria-label="New checkout link"
            readOnly
            value={created.url}
            onFocus={(e) => e.target.select()}
          />
          <button className="leads-button" onClick={() => copy(created.url)}>
            Copy link
          </button>
          <a href={created.url} target="_blank" rel="noreferrer">
            Preview client page ↗
          </a>
        </div>
      )}
      <h3>Checkout history</h3>
      <p>
        Offers are saved snapshots. Revoke and recreate a link to change the price, passport names
        or itinerary.
      </p>
      <button
        type="button"
        className="leads-button"
        disabled={pending}
        onClick={() => {
          setError('')
          load()
        }}
      >
        Refresh links
      </button>
      {loading ? (
        <p role="status">Loading checkouts…</p>
      ) : !checkouts.length ? (
        <p>No checkout pages created yet.</p>
      ) : (
        checkouts.map((item) => (
          <article className="checkout-admin-item" key={item.id}>
            <h4>
              {item.snapshot.route} · {money(Number(item.amountMinor) / 100, item.currency)}
            </h4>
            <p>
              {item.status} · Expires {new Date(item.expiresAt).toLocaleString()}
            </p>
            {item.pricing && (
              <p className="checkout-private-price">
                Agents only — cost: {money(Number(item.pricing.baseMinor) / 100, item.currency)} ·
                private profit: {money(Number(item.pricing.profitMinor) / 100, item.currency)}
              </p>
            )}
            {item.billingContact && (
              <p>
                Billing submitted: {item.billingContact.fullName} · {item.billingContact.email} ·{' '}
                {item.billingContact.phone} · {item.billingContact.country},{' '}
                {item.billingContact.city}, {item.billingContact.address}
              </p>
            )}
            {item.url && (
              <>
                <input
                  readOnly
                  aria-label={`Checkout ${item.id} link`}
                  value={item.url}
                  onFocus={(e) => e.target.select()}
                />
                <div className="checkout-admin-buttons">
                  <button className="leads-button" onClick={() => copy(item.url)}>
                    Copy link
                  </button>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    Open checkout ↗
                  </a>
                  <button
                    className="leads-button"
                    disabled={pending}
                    onClick={() => revoke(item.id)}
                  >
                    Revoke link
                  </button>
                </div>
              </>
            )}
          </article>
        ))
      )}
    </section>
  )
}
