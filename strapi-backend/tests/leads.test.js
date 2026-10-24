'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApplication, saveApplication, isClientIdConflict, IntakeError } = require('../src/api/lead/services/intake');
const callback = { source: 'callback', phone: '+998901234567' };
const booking = { source: 'booking', phone: '+998901234567', firstName: 'Test', lastName: 'Client', email: 'client@example.test', paymentMethod: 'cash', termsAccepted: true };

test('callback requires only a valid phone and defaults to Uzbek', () => {
  assert.deepEqual(validateApplication(callback), { source: 'callback', phone: '+998901234567', language: 'uz', termsAccepted: false, leadStatus: 'new' });
});

test('intake rejects malformed contact data and invalid sources', () => {
  for (const data of [null, [], {}, { ...callback, phone: '123' }, { ...callback, phone: '<script>123456789</script>' }, { ...callback, language: 'xx' }, { ...callback, email: 'invalid' }, { ...callback, source: 'admin' }, { ...callback, phone: 123456789 }]) {
    assert.throws(() => validateApplication(data), IntakeError);
  }
});

test('quotes and bookings require name and email; bookings require accepted terms and payment preference', () => {
  for (const data of [{ ...callback, source: 'quote' }, { ...booking, termsAccepted: false }, { ...booking, paymentMethod: undefined }, { ...booking, email: '' }]) assert.throws(() => validateApplication(data), IntakeError);
  assert.equal(validateApplication(booking).source, 'booking');
});

test('public callers cannot set internal ID, status, notes or arbitrary fields', () => {
  const data = validateApplication({ ...callback, clientId: '111111', leadStatus: 'closed', notes: 'injected', arbitrary: true });
  assert.equal(data.clientId, undefined);
  assert.equal(data.leadStatus, 'new');
  assert.equal(data.notes, undefined);
  assert.equal(data.arbitrary, undefined);
});

test('rejects oversized input, invalid flight prices and external page paths', () => {
  for (const data of [{ ...callback, firstName: 'a'.repeat(101) }, { ...callback, quotedPrice: -1 }, { ...callback, quotedPrice: Infinity }, { ...callback, quotedPrice: '100' }, { ...callback, pagePath: '//external.test' }]) assert.throws(() => validateApplication(data), IntakeError);
});

test('allocates six-digit references and returns the persisted entry', async () => {
  const saved = await saveApplication({ create: async ({ data }) => ({ ...data, documentId: 'saved' }) }, callback);
  assert.match(saved.clientId, /^[1-9]\d{5}$/);
  assert.equal(saved.documentId, 'saved');
});

test('retries ID collisions instead of overwriting another client', async () => {
  const ids = ['123456', '654321'];
  let attempts = 0;
  const saved = await saveApplication({ create: async ({ data }) => {
    attempts++;
    if (data.clientId === '123456') throw Object.assign(new Error('Validation failed'), { details: { errors: [{ path: ['clientId'], message: 'This attribute must be unique' }] } });
    return data;
  } }, callback, () => ids.shift());
  assert.equal(saved.clientId, '654321');
  assert.equal(attempts, 2);
  assert.equal(isClientIdConflict(new Error('UNIQUE constraint failed: leads.client_id')), true);
});

test('does not retry database failures unrelated to ID collisions', async () => {
  let attempts = 0;
  await assert.rejects(saveApplication({ create: async () => { attempts++; throw new Error('Database unavailable'); } }, callback), /Database unavailable/);
  assert.equal(attempts, 1);
});

test('stops when reference allocation is exhausted', async () => {
  let attempts = 0;
  await assert.rejects(saveApplication({ create: async () => { attempts++; throw new Error('UNIQUE constraint failed: leads.client_id'); } }, callback, () => '123456'), /Unable to allocate/);
  assert.equal(attempts, 20);
});

test('reference cannot change when an agent edits a lead', () => {
  const lifecycle = require('../src/api/lead/content-types/lead/lifecycles');
  const event = { params: { data: { clientId: '222222', leadStatus: 'contacted' } } };
  lifecycle.beforeUpdate(event);
  assert.deepEqual(event.params.data, { leadStatus: 'contacted' });
});
