import test from 'node:test'
import assert from 'node:assert/strict'
import { airportCode, localDate, searchError, formatFare } from '../src/lib/search.js'
import { findAirports, normalizeAirports } from '../src/lib/airports.js'
const valid = { from: 'Tashkent (TAS)', to: 'Istanbul (IST)', departureDate: '2026-11-01', passengers: 2, cabin: 'Business', tripType: 'one-way' }

test('search requires selected airport codes and never invents a fallback route', () => {
  assert.equal(airportCode('Tashkent'), '')
  assert.equal(airportCode('Tashkent (tas)'), 'TAS')
  assert.equal(airportCode('ist'), 'IST')
  assert(searchError({ ...valid, from: 'Tash' }, '2026-10-25'))
  assert(searchError({ ...valid, to: 'TAS' }, '2026-10-25'))
  assert.equal(searchError(valid, '2026-10-25'), '')
})

test('departure and round-trip return dates are required and checked', () => {
  for (const fields of [{ departureDate: '' }, { departureDate: '2026-02-30' }, { departureDate: '2026-10-01' }, { tripType: 'round-trip' }, { tripType: 'round-trip', returnDate: '2026-10-30' }]) assert(searchError({ ...valid, ...fields }, '2026-10-25'))
  assert.equal(searchError({ ...valid, tripType: 'round-trip', returnDate: '2026-11-01' }, '2026-10-25'), '')
  assert.equal(localDate(new Date(2026, 9, 25, 0, 1)), '2026-10-25')
})

test('unknown fares stay unavailable rather than displaying a free ticket', () => {
  assert.equal(formatFare(null, 'en-US'), null)
  assert.equal(formatFare(NaN, 'en-US'), null)
  assert.equal(formatFare(-1, 'en-US'), null)
  assert.equal(formatFare(0, 'en-US'), '$0.00')
  assert.equal(formatFare(500, 'en-US'), '$500.00')
})

test('corrupt airport cache is discarded; optional missing city/country fields are safe', () => {
  assert.deepEqual(normalizeAirports({ error: 'unavailable' }), [])
  assert.deepEqual(normalizeAirports([null, { code: 'TAS', name: ' Tashkent Airport ' }, { code: 'bad code', name: 'bad' }]), [{ code: 'TAS', name: 'Tashkent Airport', city: '', country: '' }])
})


test('an exact IATA code ranks ahead of broad airport-name matches', () => {
  const airports = [...Array.from({ length: 12 }, (_, index) => ({ code: `A${index}`, name: 'Bristol match', city: 'Other', country: 'Test' })), { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' }]
  assert.equal(findAirports(airports, 'ist')[0].code, 'IST')
  assert(!findAirports(airports, 'ist', 'IST').some(airport => airport.code === 'IST'))
})
