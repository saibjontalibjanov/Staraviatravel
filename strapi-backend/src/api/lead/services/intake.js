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
