export function normalizeAirports(data) {
  if (!Array.isArray(data)) return []
  return data.filter(airport => airport && typeof airport.code === 'string' && /^[A-Z]{3}$/i.test(airport.code.trim()) && typeof airport.name === 'string').map(airport => ({ code: airport.code.trim().toUpperCase(), name: airport.name.trim(), city: typeof airport.city === 'string' ? airport.city : '', country: typeof airport.country === 'string' ? airport.country : '' }))
}

export function findAirports(airports, query, excludeCode = '') {
  const q = query?.trim().toLowerCase()
  if (!q || q.length < 2) return []
  const rank = airport => airport.code.toLowerCase() === q ? 0 : airport.code.toLowerCase().startsWith(q) ? 1 : airport.city.toLowerCase().startsWith(q) ? 2 : airport.name.toLowerCase().startsWith(q) ? 3 : 4
  return airports.filter(airport => airport.code !== excludeCode && [airport.code, airport.name, airport.city, airport.country].some(value => value.toLowerCase().includes(q))).sort((a, b) => rank(a) - rank(b)).slice(0, 8)
}
