const draftKey = 'staravia.itinerary'
const cabins = ['Economy', 'Premium Economy', 'Business', 'First']
const airportCode = value => {
  if (typeof value !== 'string') return undefined
  const match = /\(([A-Z]{3})\)/i.exec(value)
  const code = (match?.[1] || value.trim()).toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : undefined
}

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

export function itineraryFromSearch(values) {
  const departureAirport = airportCode(values.from)
  const arrivalAirport = airportCode(values.to)
  return {
    departureAirport, arrivalAirport: arrivalAirport === departureAirport ? undefined : arrivalAirport,
    ...(validDate(values.departureDate) ? { departureDate: values.departureDate } : {}),
    ...(validDate(values.returnDate) && values.tripType !== 'one-way' && (!validDate(values.departureDate) || values.returnDate >= values.departureDate) ? { returnDate: values.returnDate } : {}),
    ...(Number.isInteger(Number(values.passengers)) && Number(values.passengers) >= 1 && Number(values.passengers) <= 9 ? { passengers: Number(values.passengers) } : {}),
    ...(cabins.includes(values.cabin) ? { cabin: values.cabin } : {}),
  }
}

export function saveItineraryDraft(values) {
  try { sessionStorage.setItem(draftKey, JSON.stringify(itineraryFromSearch(values))) } catch { /* Optional draft storage may be blocked. */ }
}

export function readItineraryDraft() {
  try { return JSON.parse(sessionStorage.getItem(draftKey)) || {} } catch { return {} }
}
