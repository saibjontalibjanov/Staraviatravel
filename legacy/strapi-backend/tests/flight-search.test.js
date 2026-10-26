'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSearch, searchFlights, FlightSearchError } = require('../src/services/flight-search');
const now = new Date('2026-10-24T12:00:00Z');
const query = { departure_id: 'TAS', arrival_id: 'IST', date: '2026-11-01', cabin: 'Business', passengers: 2 };

const providerData = {
  best_flights: [{ price: 700, total_duration: 240, flights: [{ airline: 'Test Airlines', flight_number: 'TA 123', travel_class: 'Business', duration: 240, departure_airport: { id: 'TAS', name: 'Tashkent', time: '2026-11-01 08:00' }, arrival_airport: { id: 'IST', name: 'Istanbul', time: '2026-11-01 10:00' } }] }],
};

test('normalizes airport codes, cabin aliases, and query-string passengers', () => {
  assert.deepEqual(normalizeSearch({ ...query, departure_id: ' tas ', cabin: 'first class', passengers: '3' }, now), { ...query, cabin: 'First', passengers: 3 });
});

test('rejects invalid airports, equal routes, calendar dates, cabin and passengers', () => {
  for (const invalid of [{ departure_id: 'INVALID' }, { arrival_id: 'TAS' }, { date: '2026-02-30' }, { date: '2026-10-23' }, { return_date: '2026-10-31' }, { passengers: 0 }, { passengers: 10 }, { passengers: '2.5' }, { cabin: 'unknown' }]) assert.throws(() => normalizeSearch({ ...query, ...invalid }, now), FlightSearchError);
});

test('round-trip, adults and first class map to the provider correctly', async () => {
  let params;
  const result = await searchFlights({ ...query, cabin: 'First', return_date: '2026-11-10' }, {
    now, apiKey: 'test-key', http: { get: async (url, config) => { assert.equal(url, 'https://serpapi.com/search.json'); assert.equal(config.timeout, 30000); params = config.params; return { data: providerData }; } },
  });
  assert.equal(params.adults, 2); assert.equal(params.travel_class, 4); assert.equal(params.type, 1); assert.equal(params.return_date, '2026-11-10');
  assert.equal(result.flights[0].price, 700); assert.equal(result.flights[0].legs[0].flightNumber, 'TA 123'); assert.equal(result.flights[0].type, 'round-trip');
  assert.equal(JSON.stringify(result).includes('test-key'), false);
});

test('one-way searches omit the return date and merge all valid provider offers', async () => {
  const result = await searchFlights(query, { now, apiKey: 'test-key', http: { get: async (url, { params }) => { assert.equal(params.type, 2); assert.equal(params.return_date, undefined); return { data: { ...providerData, other_flights: providerData.best_flights } }; } } });
  assert.equal(result.flights.length, 2); assert.equal(result.flights[0].stops, 0); assert.equal(result.search.passengers, 2);
});

test('empty provider results are a successful zero-offer search', async () => {
  const result = await searchFlights(query, { now, apiKey: 'test-key', http: { get: async () => ({ data: {} }) } });
  assert.deepEqual(result.flights, []); assert.match(result.message, /No flights/);
});

test('missing key fails without calling the provider', async () => {
  await assert.rejects(searchFlights(query, { now, apiKey: '', http: { get: () => assert.fail('Provider must not be called') } }), error => error.status === 503 && /SERPAPI_KEY/.test(error.message));
});

test('provider errors are safe and do not expose request configuration or keys', async () => {
  for (const [status, expectedStatus] of [[401, 503], [403, 503], [429, 503], [500, 502]]) {
    await assert.rejects(searchFlights(query, { now, apiKey: 'sensitive-test-key', http: { get: async () => { throw Object.assign(new Error('sensitive-test-key'), { response: { status }, config: { api_key: 'sensitive-test-key' } }); } } }), error => error.status === expectedStatus && !error.message.includes('sensitive-test-key'));
  }
});

test('provider response errors are not reported as successful empty results', async () => {
  await assert.rejects(searchFlights(query, { now, apiKey: 'test-key', http: { get: async () => ({ data: { error: 'Provider error' } }) } }), error => error.status === 502);
});

test('multi-city search validates ordered journeys and sends the correct provider request', async () => {
 const multiCity=[{departure_id:'TAS',arrival_id:'IST',date:'2026-11-01'},{departure_id:'IST',arrival_id:'DXB',date:'2026-11-05'}];
 const result=await searchFlights({...query,tripType:'multi-city',multiCity},{now,apiKey:'test-key',http:{get:async(url,{params})=>{assert.equal(params.type,3);assert.deepEqual(JSON.parse(params.multi_city_json),multiCity);assert.equal(params.departure_id,undefined);return{data:providerData}}}});
 assert.equal(result.flights[0].type,'multi-city');assert.equal(result.search.multiCity.length,2);
 assert.throws(()=>normalizeSearch({...query,tripType:'multi-city',multiCity:multiCity.slice(0,1)},now));
 assert.throws(()=>normalizeSearch({...query,tripType:'multi-city',multiCity:[multiCity[1],multiCity[0]]},now));
});
