export function airportCode(value) {
  if (typeof value !== 'string') return ''
  const match = /\(([A-Z]{3})\)$/i.exec(value.trim())
  const code = (match?.[1] || value.trim()).toUpperCase()
  return /^[A-Z]{3}$/.test(code) ? code : ''
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value

export function searchError({ from, to, departureDate, returnDate, tripType, passengers = 1, cabin = 'Business' }, today = localDate()) {
  const origin = airportCode(from), destination = airportCode(to)
  if (!origin || !destination) return 'Select a valid departure and arrival airport.'
  if (origin === destination) return 'Departure and arrival airports must be different.'
  if (!validDate(departureDate) || departureDate < today) return 'Choose a departure date today or later.'
  if (tripType === 'round-trip' && (!validDate(returnDate) || returnDate < departureDate)) return 'Choose a return date on or after departure.'
  if (!/^[1-9]$/.test(String(passengers))) return 'Passenger count must be between 1 and 9.'
  if (!['Economy', 'Premium Economy', 'Business', 'First'].includes(cabin)) return 'Choose a supported cabin class.'
  return ''
}

export function formatFare(price, locale) {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0 ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(price) : null
}
