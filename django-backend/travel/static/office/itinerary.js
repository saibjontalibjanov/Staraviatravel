export const emptyLeg = (lead = {}) => ({
  from: lead.departureAirport || '',
  to: lead.arrivalAirport || '',
  fromCity: '',
  toCity: '',
  departureDate: lead.departureDate || '',
  arrivalDate: lead.departureDate || '',
  departureTime: '',
  arrivalTime: '',
  departureTerminal: '',
  arrivalTerminal: '',
  airline: lead.airline || '',
  flightNumber: '',
  cabin: lead.cabin || 'Economy',
  durationMinutes: '',
})
const splitTime = (value, fallback) => {
  const match = String(value || '').match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/)
  return match ? { date: match[1], time: match[2] } : { date: fallback || '', time: '' }
}
export function fromOffer(selection, lead) {
  const { flight, search } = selection
  const expected = search.multiCity || [
    { departure_id: search.departure_id, arrival_id: search.arrival_id, date: search.date },
    ...(search.return_date
      ? [
          {
            departure_id: search.arrival_id,
            arrival_id: search.departure_id,
            date: search.return_date,
          },
        ]
      : []),
  ]
  const cities = new Map(flight.legs.flatMap(leg => [[leg.departure.code, leg.departure.city || leg.departure.airport], [leg.arrival.code, leg.arrival.city || leg.arrival.airport]]))
  const remaining = [...flight.legs]
  const journeys = expected.map((item, index) => {
    const legs = []
    while (remaining.length && (legs.length || remaining[0].departure.code === item.departure_id)) {
      const source = remaining.shift()
      const departure = splitTime(source.departure.time, item.date)
      const arrival = splitTime(source.arrival.time, '')
      legs.push({
        ...emptyLeg(),
        from: source.departure.code,
        to: source.arrival.code,
        fromCity: source.departure.city || source.departure.airport || source.departure.code,
        toCity: source.arrival.city || source.arrival.airport || source.arrival.code,
        departureDate: departure.date,
        arrivalDate: arrival.date,
        departureTime: departure.time,
        arrivalTime: arrival.time,
        departureTerminal: source.departure.terminal || '',
        arrivalTerminal: source.arrival.terminal || '',
        airline: source.airline,
        flightNumber: source.flightNumber,
        cabin: source.cabin,
        durationMinutes: source.duration ?? '',
      })
      if (source.arrival.code === item.arrival_id) break
    }
    return {
      legs: legs.length
        ? legs
        : [
            {
              ...emptyLeg({...lead, cabin: search.cabin || flight.cabin || lead.cabin, airline: flight.airline || lead.airline}),
              from: item.departure_id,
              to: item.arrival_id,
              fromCity: cities.get(item.departure_id) || item.departure_id,
              toCity: cities.get(item.arrival_id) || item.arrival_id,
              departureDate: item.date,
              arrivalDate: '',
            },
          ],
    }
  })
  return {
    journeys,
    tripType: search.multiCity ? 'multi-city' : search.return_date ? 'round-trip' : 'one-way',
    route:
      journeys.length === 2 && search.return_date
        ? `${journeys[0].legs[0].fromCity} ⇄ ${journeys[0].legs.at(-1).toCity}`
        : [
            journeys[0].legs[0].fromCity,
            ...journeys.map((journey) => journey.legs.at(-1).toCity),
          ].join(' → '),
  }
}
export function pricePreview(price, currency, rate, profit) {
  if (!Number.isFinite(price) || !/^\d{1,9}(\.\d{1,2})?$/.test(profit)) return null
  const source = BigInt(Math.round(price * 100))
  const [whole, fraction = ''] = profit.split('.')
  const profitMinor = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  let base = source
  if (currency === 'UZS') {
    if (!/^\d{1,6}(\.\d{1,6})?$/.test(rate) || Number(rate) <= 0) return null
    const [r, f = ''] = rate.split('.')
    base = (source * (BigInt(r) * 1000000n + BigInt(f.padEnd(6, '0'))) + 500000n) / 1000000n
  }
  return {
    base: Number(base) / 100,
    profit: Number(profitMinor) / 100,
    total: Number(base + profitMinor) / 100,
  }
}

export function initialSearch(lead = {}) {
  const legacyCodes = [...(lead.flightRoute || '').matchAll(/\(([A-Z]{3})\)/g)].map(match => match[1])
  return {
    departure_id: lead.departureAirport || legacyCodes[0] || '',
    arrival_id: lead.arrivalAirport || legacyCodes[1] || '',
    date: lead.departureDate || '', return_date: lead.returnDate || '',
    passengers: lead.passengers || 1, cabin: lead.cabin || 'Business',
  }
}


export function checkoutAutofill(selection, lead = {}) {
  const itinerary = fromOffer(selection, lead)
  const flight = selection.flight
  const language = lead.language || 'uz'
  const defaults = {
    en: { terms: 'Changes, cancellations and refunds are subject to the selected airline fare conditions. Please confirm the exact conditions with your agent before payment.', payment: 'Please contact your Staravia agent to confirm payment arrangements for this offer.' },
    uz: { terms: 'O‘zgartirish, bekor qilish va pulni qaytarish tanlangan aviakompaniya tarifi shartlariga bog‘liq. To‘lovdan oldin aniq shartlarni agentingiz bilan tasdiqlang.', payment: 'Ushbu taklif bo‘yicha to‘lov tartibini tasdiqlash uchun Staravia agentingizga murojaat qiling.' },
    ru: { terms: 'Изменения, отмена и возврат регулируются условиями выбранного тарифа авиакомпании. До оплаты уточните точные условия у вашего агента.', payment: 'Свяжитесь с вашим агентом Staravia для подтверждения порядка оплаты этого предложения.' },
  }[language] || null
  const baggage = Array.isArray(flight.baggageDetails) ? flight.baggageDetails.filter(item => ['checked','cabin','personal'].includes(item.type) && typeof item.allowance === 'string').map(item => ({type:item.type,allowance:item.allowance,appliesTo:item.appliesTo || 'Per passenger · selected fare'})) : []
  if (!baggage.length && typeof flight.baggage === 'string' && flight.baggage.trim()) {
    const value = flight.baggage.trim()
    const types = [['cabin', /cabin|carry.on/i], ['personal', /personal/i], ['checked', /checked|check.in|hold/i]].filter(([,pattern]) => pattern.test(value)).map(([type]) => type)
    const type = types.length === 1 ? types[0] : null
    if (type) baggage.push({ type, allowance:value, appliesTo:'Per passenger · selected fare' })
  }
  const missing = itinerary.journeys.flatMap((journey, index) => journey.legs.flatMap((leg, segment) => ['from','to','departureDate','arrivalDate','departureTime','arrivalTime','airline','flightNumber','cabin','durationMinutes'].filter(key => !leg[key]).map(key => `Journey ${index+1}, flight ${segment+1}: ${key}`)))
  return { ...itinerary, baggage, language, currency:'USD', fareTerms:flight.fareTerms || defaults?.terms || '', paymentInformation:flight.paymentInformation || defaults?.payment || '', missing }
}
