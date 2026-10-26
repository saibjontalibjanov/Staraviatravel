import test from 'node:test'
import assert from 'node:assert/strict'
import { itineraryFromSearch } from '../src/lib/itinerary.js'
import { initialSearch } from '../django-backend/travel/static/office/itinerary.js'

test('website search values become structured lead travel details', () => {
  const itinerary = itineraryFromSearch({ from: 'Tashkent (TAS)', to: 'istanbul (ist)', departureDate: '2026-11-01', returnDate: '2026-11-10', passengers: '3', cabin: 'Premium Economy' })
  assert.deepEqual(itinerary, { departureAirport: 'TAS', arrivalAirport: 'IST', departureDate: '2026-11-01', returnDate: '2026-11-10', passengers: 3, cabin: 'Premium Economy' })
  assert.deepEqual(initialSearch(itinerary), { departure_id: 'TAS', arrival_id: 'IST', date: '2026-11-01', return_date: '2026-11-10', passengers: 3, cabin: 'Premium Economy' })
})

test('one-way bookings never carry a previous round-trip return date', () => {
  assert.equal(itineraryFromSearch({ tripType: 'one-way', returnDate: '2026-11-10' }).returnDate, undefined)
})

test('unfinished search values do not invalidate a contact application', () => {
  const itinerary = itineraryFromSearch({ from: 'Ta', to: '', departureDate: '2026-02-30', passengers: 20, cabin: 'unknown' })
  assert.equal(itinerary.departureAirport, undefined)
  assert.equal(itinerary.arrivalAirport, undefined)
  assert.equal(itinerary.departureDate, undefined)
  assert.equal(itinerary.passengers, undefined)
  assert.equal(itinerary.cabin, undefined)
  assert.equal(itineraryFromSearch({ departureDate: '2026-11-10', returnDate: '2026-11-01' }).returnDate, undefined)
})

test('legacy lead routes prefill airports without inventing missing travel dates', () => {
  assert.deepEqual(initialSearch({ flightRoute: 'Tashkent (TAS) → Istanbul (IST)' }), { departure_id: 'TAS', arrival_id: 'IST', date: '', return_date: '', passengers: 1, cabin: 'Business' })
})

test('explicit lead airports take precedence over legacy route text', () => {
  const search = initialSearch({ departureAirport: 'LHR', arrivalAirport: 'JFK', flightRoute: '(TAS) → (IST)', passengers: 2, cabin: 'First' })
  assert.equal(search.departure_id, 'LHR')
  assert.equal(search.arrival_id, 'JFK')
  assert.equal(search.passengers, 2)
  assert.equal(search.cabin, 'First')
})
