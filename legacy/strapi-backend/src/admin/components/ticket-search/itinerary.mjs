export function initialSearch(lead = {}) {
  const legacyCodes = [...(lead.flightRoute || '').matchAll(/\(([A-Z]{3})\)/g)].map(match => match[1])
  return {
    departure_id: lead.departureAirport || legacyCodes[0] || '',
    arrival_id: lead.arrivalAirport || legacyCodes[1] || '',
    date: lead.departureDate || '', return_date: lead.returnDate || '',
    passengers: lead.passengers || 1, cabin: lead.cabin || 'Business',
  }
}
