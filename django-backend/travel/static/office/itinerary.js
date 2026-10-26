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
  const remaining = [...flight.legs]
  const journeys = expected.map((item, index) => {
    const legs = []
    while (remaining.length && (legs.length || remaining[0].departure.code === item.departure_id)) {
      const source = remaining.shift()
      const departure = splitTime(source.departure.time, item.date)
      const arrival = splitTime(source.arrival.time, departure.date)
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
              ...emptyLeg(lead),
              from: item.departure_id,
              to: item.arrival_id,
              fromCity: item.departure_id,
              toCity: item.arrival_id,
              departureDate: item.date,
              arrivalDate: item.date,
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
