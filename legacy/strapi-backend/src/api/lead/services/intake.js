'use strict';

const { randomInt } = require('node:crypto');
const sources = ['callback', 'quote', 'booking'];
const languages = ['uz', 'ru', 'en'];
const paymentMethods = ['credit-card', 'debit-card', 'bank-transfer', 'cash'];

class IntakeError extends Error {}

function validateApplication(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new IntakeError('Invalid application.');
  const data = {};
  const text = (key, max, required = false) => {
    const value = input[key];
    if (value === undefined || value === null || value === '') {
      if (required) throw new IntakeError(`${key} is required.`);
      return;
    }
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new IntakeError(`Invalid ${key}.`);
    data[key] = value.trim();
  };
  if (!sources.includes(input.source)) throw new IntakeError('Invalid application source.');
  data.source = input.source;
  const fullApplication = input.source !== 'callback';
  text('firstName', 100, fullApplication);
  text('lastName', 100, fullApplication);
  text('phone', 30, true);
  if (!/^\+?[0-9 ()-]+$/.test(data.phone) || !/^\d{7,15}$/.test(data.phone.replace(/\D/g, ''))) throw new IntakeError('Invalid phone number.');
  text('email', 254, fullApplication);
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new IntakeError('Invalid email address.');
  data.language = input.language === undefined ? 'uz' : input.language;
  if (!languages.includes(data.language)) throw new IntakeError('Invalid language.');
  text('pagePath', 500);
  if (data.pagePath && (!data.pagePath.startsWith('/') || data.pagePath.startsWith('//'))) throw new IntakeError('Invalid page path.');
  text('flightRoute', 200);
  text('airline', 100);
  if (input.quotedPrice !== undefined && input.quotedPrice !== null) {
    if (typeof input.quotedPrice !== 'number' || !Number.isFinite(input.quotedPrice) || input.quotedPrice < 0 || input.quotedPrice > 100000000) throw new IntakeError('Invalid quoted price.');
    data.quotedPrice = input.quotedPrice;
  }
  if (input.paymentMethod !== undefined && input.paymentMethod !== '') {
    if (!paymentMethods.includes(input.paymentMethod)) throw new IntakeError('Invalid payment method.');
    data.paymentMethod = input.paymentMethod;
  }
  if (input.source === 'booking' && (input.termsAccepted !== true || !data.paymentMethod)) throw new IntakeError('Accept the terms and select a payment method.');
  for (const key of ['departureAirport', 'arrivalAirport']) {
    if (input[key] !== undefined && input[key] !== '') {
      if (typeof input[key] !== 'string' || !/^[A-Z]{3}$/.test(input[key])) throw new IntakeError(`Invalid ${key}.`);
      data[key] = input[key];
    }
  }
  if (data.departureAirport && data.departureAirport === data.arrivalAirport) throw new IntakeError('Departure and arrival must be different.');
  for (const key of ['departureDate', 'returnDate']) {
    if (input[key] !== undefined && input[key] !== '') {
      const value = input[key];
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new IntakeError(`Invalid ${key}.`);
      data[key] = value;
    }
  }
  if (data.returnDate && data.departureDate && data.returnDate < data.departureDate) throw new IntakeError('Return date must be on or after departure.');
  if (input.passengers !== undefined) {
    if (!Number.isInteger(input.passengers) || input.passengers < 1 || input.passengers > 9) throw new IntakeError('Invalid passenger count.');
    data.passengers = input.passengers;
  }
  if (input.cabin !== undefined) {
    if (!['Economy', 'Premium Economy', 'Business', 'First'].includes(input.cabin)) throw new IntakeError('Invalid cabin class.');
    data.cabin = input.cabin;
  }
  data.termsAccepted = input.termsAccepted === true;
  data.leadStatus = 'new';
  return data;
}

function isClientIdConflict(error) {
  if (error?.details?.errors?.some(item => item.path?.includes('clientId') && /unique/i.test(item.message))) return true;
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`;
  return /unique|duplicate/i.test(message) && /client_?id/i.test(message);
}

async function saveApplication(documents, input, generateId = () => String(randomInt(100000, 1000000))) {
  const data = validateApplication(input);
  for (let attempt = 0; attempt < 20; attempt++) {
    const clientId = generateId();
    try {
      return await documents.create({ data: { ...data, clientId } });
    } catch (error) {
      if (!isClientIdConflict(error)) throw error;
    }
  }
  throw new Error('Unable to allocate a unique client ID.');
}

module.exports = { IntakeError, validateApplication, isClientIdConflict, saveApplication };
