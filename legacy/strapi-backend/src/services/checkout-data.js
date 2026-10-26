'use strict';
const { randomUUID } = require('node:crypto');
class CheckoutError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const nameKey = (value) =>
  String(value || '')
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
const text = (value, max, label, required = false) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim()))
    throw new CheckoutError(`Invalid ${label}.`);
  return value.trim();
};
const date = (value, required = true) => {
  if (!value && !required) return '';
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    throw new CheckoutError('Invalid date.');
  return value;
};
function moneyMinor(value, label, allowZero = false) {
  if (typeof value !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(value))
    throw new CheckoutError(`Invalid ${label}: use up to two decimal places.`);
  const [whole, fraction = ''] = value.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amount < (allowZero ? 0 : 1) || amount > 99999999999)
    throw new CheckoutError(`Invalid ${label}.`);
  return amount;
}
function validatePassports(input, now = new Date()) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 9)
    throw new CheckoutError('Add passport details for 1–9 passengers.');
  const ids = new Set();
  const numbers = new Set();
  return input.map((passenger) => {
    if (!passenger || typeof passenger !== 'object') throw new CheckoutError('Invalid passenger.');
    const id = passenger.id || randomUUID();
    if (!/^[0-9a-f-]{36}$/i.test(id) || ids.has(id))
      throw new CheckoutError('Invalid or duplicate passenger reference.');
    ids.add(id);
    const firstName = text(passenger.firstName, 100, 'passport given names', true).replace(
      /\s+/g,
      ' ',
    );
    const lastName = text(passenger.lastName, 100, 'passport surname', true).replace(/\s+/g, ' ');
    const passportNumber = text(
      passenger.passportNumber,
      30,
      'passport number',
      true,
    ).toUpperCase();
    if (!/^[A-Z0-9 -]{3,30}$/.test(passportNumber) || numbers.has(passportNumber))
      throw new CheckoutError('Invalid or duplicate passport number.');
    numbers.add(passportNumber);
    const birthDate = date(passenger.birthDate);
    const expiryDate = date(passenger.expiryDate);
    if (
      birthDate >= now.toISOString().slice(0, 10) ||
      expiryDate <= now.toISOString().slice(0, 10) ||
      expiryDate <= birthDate
    )
      throw new CheckoutError('Check passport birth and expiry dates.');
    if (!['adult', 'child', 'infant'].includes(passenger.passengerType))
      throw new CheckoutError('Invalid passenger type.');
    return {
      id,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      passportNumber,
      birthDate,
      expiryDate,
      nationality: text(passenger.nationality, 60, 'nationality', true),
      passengerType: passenger.passengerType,
    };
  });
}
function validateJourneys(input, tripType, now) {
  if (!['one-way', 'round-trip', 'multi-city'].includes(tripType) || !Array.isArray(input))
    throw new CheckoutError('Choose a supported trip type.');
  if (
    (tripType === 'one-way' && input.length !== 1) ||
    (tripType === 'round-trip' && input.length !== 2) ||
    (tripType === 'multi-city' && (input.length < 2 || input.length > 6))
  )
    throw new CheckoutError('Check the number of journeys for this trip type.');
  let previousDate = '';
  const journeys = input.map((journey, index) => {
    if (
      !journey ||
      !Array.isArray(journey.legs) ||
      journey.legs.length < 1 ||
      journey.legs.length > 6
    )
      throw new CheckoutError('Each journey needs 1–6 flight segments.');
    const legs = journey.legs.map((leg) => {
      if (!leg || typeof leg !== 'object') throw new CheckoutError('Invalid flight segment.');
      const departureDate = date(leg.departureDate);
      const arrivalDate = date(leg.arrivalDate);
      if (departureDate < now.toISOString().slice(0, 10) || arrivalDate < departureDate)
        throw new CheckoutError('Check flight dates.');
      const from = text(leg.from, 3, 'departure airport', true).toUpperCase();
      const to = text(leg.to, 3, 'arrival airport', true).toUpperCase();
      if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || from === to)
        throw new CheckoutError('Enter different three-letter flight airports.');
      const departureTime = text(leg.departureTime, 5, 'departure time', true);
      const arrivalTime = text(leg.arrivalTime, 5, 'arrival time', true);
      if (![departureTime, arrivalTime].every((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)))
        throw new CheckoutError('Enter valid flight times.');
      const durationMinutes = Number(leg.durationMinutes);
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 2880)
        throw new CheckoutError('Enter a flight duration in minutes.');
      return {
        from,
        to,
        fromCity: text(leg.fromCity, 100, 'departure city', true),
        toCity: text(leg.toCity, 100, 'arrival city', true),
        departureDate,
        arrivalDate,
        departureTime,
        arrivalTime,
        departureTerminal: text(leg.departureTerminal, 30, 'departure terminal'),
        arrivalTerminal: text(leg.arrivalTerminal, 30, 'arrival terminal'),
        airline: text(leg.airline, 100, 'airline', true),
        flightNumber: text(leg.flightNumber, 30, 'flight number', true),
        cabin: text(leg.cabin, 50, 'seat class', true),
        durationMinutes,
      };
    });
    if (legs[0].departureDate < previousDate)
      throw new CheckoutError('Journeys must be in date order.');
    const layovers = [];
    for (let i = 1; i < legs.length; i++) {
      if (
        legs[i - 1].to !== legs[i].from ||
        `${legs[i].departureDate}T${legs[i].departureTime}` <
          `${legs[i - 1].arrivalDate}T${legs[i - 1].arrivalTime}`
      )
        throw new CheckoutError(
          'Connecting flights must use the same airport and follow arrival time.',
        );
      // Connection times are local to the same airport, so no cross-zone subtraction.
      layovers.push({
        airport: legs[i].from,
        city: legs[i].fromCity,
        minutes: Math.round(
          (Date.parse(`${legs[i].departureDate}T${legs[i].departureTime}Z`) -
            Date.parse(`${legs[i - 1].arrivalDate}T${legs[i - 1].arrivalTime}Z`)) /
            60000,
        ),
      });
    }
    previousDate = legs.at(-1).arrivalDate;
    return {
      label: tripType === 'round-trip' ? (index === 0 ? 'outbound' : 'return') : 'segment',
      legs,
      stops: legs.length - 1,
      layovers,
      durationMinutes:
        legs.reduce((sum, leg) => sum + leg.durationMinutes, 0) +
        layovers.reduce((sum, stop) => sum + stop.minutes, 0),
    };
  });
  if (
    tripType === 'round-trip' &&
    (journeys[0].legs[0].from !== journeys[1].legs.at(-1).to ||
      journeys[0].legs.at(-1).to !== journeys[1].legs[0].from)
  )
    throw new CheckoutError(
      'Round-trip return airports must reverse the outbound route. Use multi-city for a different routing.',
    );
  return journeys;
}
function validate(input, lead, now = new Date(), quote) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new CheckoutError('Invalid checkout details.');
  if (input.fareConfirmed !== true)
    throw new CheckoutError(
      'Confirm the selected fare covers all passengers, journeys and baggage.',
    );
  if (
    !quote ||
    !quote.offer ||
    quote.offer.price == null ||
    !Number.isFinite(quote.offer.price) ||
    quote.offer.price <= 0 ||
    new Date(quote.expiresAt) <= now
  )
    throw new CheckoutError(
      'Choose a current priced fare from ticket search. Search again if the offer has expired.',
    );
  if (!['USD', 'UZS'].includes(input.currency)) throw new CheckoutError('Choose USD or UZS.');
  const sourceMinor = moneyMinor(quote.offer.price.toFixed(2), 'selected fare');
  let exchangeRate = '1';
  let baseMinor = sourceMinor;
  if (input.currency === 'UZS') {
    if (
      typeof input.exchangeRate !== 'string' ||
      !/^\d{1,6}(\.\d{1,6})?$/.test(input.exchangeRate) ||
      Number(input.exchangeRate) <= 0
    )
      throw new CheckoutError('Set the actual USD to UZS exchange rate.');
    exchangeRate = input.exchangeRate;
    const [whole, fraction = ''] = exchangeRate.split('.');
    const factor = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
    baseMinor = Number((BigInt(sourceMinor) * factor + 500000n) / 1000000n);
  }
  const profitMinor = moneyMinor(input.profit, 'profit', true);
  const amountMinor = baseMinor + profitMinor;
  if (!Number.isSafeInteger(amountMinor) || amountMinor > 99999999999)
    throw new CheckoutError('Total exceeds the supported limit.');
  if (!Number.isInteger(input.expiryDays) || input.expiryDays < 1 || input.expiryDays > 30)
    throw new CheckoutError('Link validity must be 1–30 days.');
  if (
    typeof input.requestId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)
  )
    throw new CheckoutError('Invalid creation reference.');
  if (!['uz', 'ru', 'en'].includes(input.language))
    throw new CheckoutError('Invalid checkout language.');
  if (!Array.isArray(lead.passportDetails) || !lead.passportDetails.length)
    throw new CheckoutError('Save Passport Details on this lead before creating a checkout.');
  const passports = validatePassports(lead.passportDetails, now);
  const journeys = validateJourneys(input.journeys, input.tripType, now);
  if (
    passports.some((passenger) => passenger.expiryDate <= journeys.at(-1).legs.at(-1).arrivalDate)
  )
    throw new CheckoutError('A passport expires before the trip ends. Check Passport Details.');
  if (!Array.isArray(input.baggage) || input.baggage.length > 20)
    throw new CheckoutError('Invalid baggage details.');
  const baggage = input.baggage.map((item) => ({
    type: ['checked', 'cabin', 'personal'].includes(item?.type)
      ? item.type
      : (() => {
          throw new CheckoutError('Invalid baggage type.');
        })(),
    allowance: text(item.allowance, 200, 'baggage allowance', true),
    appliesTo: text(item.appliesTo, 200, 'baggage applicability', true),
  }));
  return {
    amountMinor: String(amountMinor),
    currency: input.currency,
    requestId: input.requestId,
    expiresAt: new Date(now.getTime() + input.expiryDays * 86400000).toISOString(),
    pricing: {
      baseMinor: String(baseMinor),
      profitMinor: String(profitMinor),
      sourceMinor: String(sourceMinor),
      sourceCurrency: 'USD',
      exchangeRate,
      quoteReference: quote.reference,
    },
    snapshot: {
      version: 2,
      clientId: lead.clientId,
      route: text(input.route, 200, 'route', true),
      tripType: input.tripType,
      journeys,
      baggage,
      passengerDetails: passports.map(({ id, fullName, passengerType }) => ({
        id,
        fullName,
        passengerType,
      })),
      passengers: passports.length,
      passengerName: passports[0].fullName,
      departureDate: journeys[0].legs[0].departureDate,
      returnDate: input.tripType === 'round-trip' ? journeys[1].legs[0].departureDate : '',
      cabin: journeys[0].legs[0].cabin,
      airline: journeys[0].legs[0].airline,
      fareTerms: text(input.fareTerms, 5000, 'fare and refund terms', true),
      paymentInformation: text(input.paymentInformation, 2000, 'client payment information'),
      language: input.language,
    },
  };
}
function validateBilling(input, snapshot) {
  if (!input || typeof input !== 'object' || !Array.isArray(snapshot.passengerDetails))
    throw new CheckoutError(
      'Billing is unavailable for this checkout. Ask your agent for an updated link.',
    );
  const fullName = text(input.fullName, 201, 'billing full name', true);
  if (
    !snapshot.passengerDetails.some(
      (passenger) => nameKey(passenger.fullName) === nameKey(fullName),
    )
  )
    throw new CheckoutError('Billing full name must match a passport passenger on this booking.');
  const email = text(input.email, 254, 'billing email', true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError('Invalid billing email.');
  const phone = text(input.phone, 30, 'billing phone', true);
  if (
    !/^\+?[\d ()-]{7,30}$/.test(phone) ||
    phone.replace(/\D/g, '').length < 7 ||
    phone.replace(/\D/g, '').length > 15
  )
    throw new CheckoutError('Invalid billing phone.');
  return {
    fullName: snapshot.passengerDetails.find(
      (passenger) => nameKey(passenger.fullName) === nameKey(fullName),
    ).fullName,
    email,
    phone,
    country: text(input.country, 80, 'country', true),
    city: text(input.city, 100, 'city', true),
    address: text(input.address, 300, 'billing address', true),
  };
}
module.exports = {
  CheckoutError,
  text,
  date,
  nameKey,
  moneyMinor,
  validatePassports,
  validateJourneys,
  validate,
  validateBilling,
};
