'use strict';
const axios = require('axios');
const airportCities = new Map(require('../api/airport/airports-data.json').map(airport => [airport.code, airport.city]));

class FlightSearchError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const cabins = { economy: 1, 'premium economy': 2, business: 3, first: 4 };
const cabinNames = { economy: 'Economy', 'premium economy': 'Premium Economy', business: 'Business', first: 'First' };

function normalizeSearch(input = {}, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new FlightSearchError('Invalid search request.');
  if (input.cabin !== undefined && typeof input.cabin !== 'string') throw new FlightSearchError('Choose a supported cabin class.');
  if (input.tripType === 'multi-city') {
    if (!Array.isArray(input.multiCity) || input.multiCity.length < 2 || input.multiCity.length > 6) throw new FlightSearchError('Multi-city search needs 2–6 journeys.');
    const journeys = input.multiCity.map(item => normalizeSearch({ departure_id: item?.departure_id, arrival_id: item?.arrival_id, date: item?.date, cabin: input.cabin, passengers: input.passengers }, now));
    if (journeys.some((item,index)=>index>0 && item.date<journeys[index-1].date)) throw new FlightSearchError('Multi-city dates must be in order.');
    return { departure_id: journeys[0].departure_id, arrival_id: journeys.at(-1).arrival_id, date: journeys[0].date, cabin: journeys[0].cabin, passengers: journeys[0].passengers, tripType: 'multi-city', multiCity: journeys.map(({departure_id,arrival_id,date})=>({departure_id,arrival_id,date})) };
  }
  const departure = typeof input.departure_id === 'string' ? input.departure_id.trim().toUpperCase() : '';
  const arrival = typeof input.arrival_id === 'string' ? input.arrival_id.trim().toUpperCase() : '';
  if (!/^[A-Z]{3}$/.test(departure) || !/^[A-Z]{3}$/.test(arrival)) throw new FlightSearchError('Enter valid three-letter departure and arrival airport codes.');
  if (departure === arrival) throw new FlightSearchError('Departure and arrival airports must be different.');
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(input.date) || input.date < now.toISOString().slice(0, 10)) throw new FlightSearchError('Choose a valid departure date today or later.');
  if (input.return_date && (!validDate(input.return_date) || input.return_date < input.date)) throw new FlightSearchError('Return date must be on or after departure.');
  const cabin = typeof input.cabin === 'string' ? input.cabin.trim().toLowerCase().replace(/^first class$/, 'first') : 'business';
  if (!Object.hasOwn(cabins, cabin)) throw new FlightSearchError('Choose a supported cabin class.');
  const rawPassengers = input.passengers ?? 1;
  const passengers = (typeof rawPassengers === 'number' || typeof rawPassengers === 'string') && /^[1-9]$/.test(String(rawPassengers)) ? Number(rawPassengers) : NaN;
  if (!Number.isInteger(passengers)) throw new FlightSearchError('Passenger count must be between 1 and 9.');
  return { departure_id: departure, arrival_id: arrival, date: input.date, ...(input.return_date ? { return_date: input.return_date } : {}), cabin: cabinNames[cabin], passengers };
}

function formatFlights(data, search) {
  const offers = [...(Array.isArray(data.best_flights) ? data.best_flights : []), ...(Array.isArray(data.other_flights) ? data.other_flights : [])];
  return offers.filter(offer => Array.isArray(offer.flights) && offer.flights.length).map((offer, index) => {
    const legs = offer.flights.map(leg => ({
      airline: leg.airline || 'Unknown Airline', flightNumber: leg.flight_number || '', cabin: leg.travel_class || search.cabin,
      departure: { airport: leg.departure_airport?.name || '', city: airportCities.get(leg.departure_airport?.id) || leg.departure_airport?.name || '', code: leg.departure_airport?.id || '', time: leg.departure_airport?.time || '', terminal: leg.departure_airport?.terminal || '' },
      arrival: { airport: leg.arrival_airport?.name || '', city: airportCities.get(leg.arrival_airport?.id) || leg.arrival_airport?.name || '', code: leg.arrival_airport?.id || '', time: leg.arrival_airport?.time || '', terminal: leg.arrival_airport?.terminal || '' },
      duration: typeof leg.duration === 'number' ? leg.duration : null,
    }));
    return {
      id: index + 1, airline: legs[0].airline, airlineLogo: /^https:\/\//.test(offer.flights[0].airline_logo || '') ? offer.flights[0].airline_logo : null,
      flightNumber: legs.map(leg => leg.flightNumber).filter(Boolean).join(' / '),
      departure: { ...legs[0].departure, code: legs[0].departure.code || search.departure_id },
      arrival: { ...legs[legs.length - 1].arrival, code: legs[legs.length - 1].arrival.code || search.arrival_id },
      duration: typeof offer.total_duration === 'number' ? offer.total_duration : null,
      stops: legs.length - 1, price: typeof offer.price === 'number' && Number.isFinite(offer.price) ? offer.price : null,
      cabin: legs[0].cabin, type: search.tripType === 'multi-city' ? 'multi-city' : search.return_date ? 'round-trip' : 'one-way', legs,
      layovers: Array.isArray(offer.layovers) ? offer.layovers.map(stop => ({ airport: stop.id || '', city: stop.name || '', minutes: typeof stop.duration === 'number' ? stop.duration : null })) : [],
      baggage: typeof offer.baggage === 'string' ? offer.baggage : '',
    };
  });
}

async function searchFlights(input, options = {}) {
  const search = normalizeSearch(input, options.now);
  const apiKey = options.apiKey ?? process.env.SERPAPI_KEY;
  if (!apiKey) throw new FlightSearchError('Ticket search is not configured. Add SERPAPI_KEY on the Strapi server.', 503);
  const cabinKey = search.cabin.toLowerCase();
  let data;
  try {
    const response = await (options.http || axios).get('https://serpapi.com/search.json', {
      timeout: 30000,
      params: { engine: 'google_flights', ...(search.multiCity ? { multi_city_json: JSON.stringify(search.multiCity.map(({departure_id,arrival_id,date})=>({departure_id,arrival_id,date}))) } : { departure_id: search.departure_id, arrival_id: search.arrival_id, outbound_date: search.date }),
        ...(search.return_date ? { return_date: search.return_date } : {}), type: search.multiCity ? 3 : search.return_date ? 1 : 2,
        adults: search.passengers, travel_class: cabins[cabinKey], currency: 'USD', hl: 'en', api_key: apiKey },
    });
    data = response.data;
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) throw new FlightSearchError('The flight provider search quota has been reached. Please try again later.', 503);
    if (status === 401 || status === 403) throw new FlightSearchError('The flight provider rejected the configured credentials. Ask your administrator to check the provider account.', 503);
    throw new FlightSearchError('The flight provider is unavailable or timed out. Please try again.', 502);
  }
  if (!data || typeof data !== 'object' || data.error) throw new FlightSearchError('The flight provider could not complete this search. Check the route and dates, then try again.', 502);
  const flights = formatFlights(data, search);
  return { flights, search, currency: 'USD', searchedAt: new Date().toISOString(), ...(flights.length ? {} : { message: 'No flights found for this search.' }) };
}

module.exports = { FlightSearchError, normalizeSearch, formatFlights, searchFlights };
