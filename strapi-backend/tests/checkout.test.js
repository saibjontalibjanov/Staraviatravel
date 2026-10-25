'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { validate, websiteOrigin, hashToken, tokenValid, state, publicCheckout, registerCheckoutRoutes } = require('../src/services/lead-checkout');
const input = () => ({ requestId: crypto.randomUUID(), amount: '1156.80', currency: 'USD', expiryDays: 7, route: 'TAS → DXB', passengerName: 'Aziz Karimov', passengers: 2, departureDate: '2030-05-15', returnDate: '2030-05-22', cabin: 'Economy', fareTerms: 'Non-refundable. Changes subject to the airline fee.', language: 'uz', internalNotes: 'secret', paymentStatus: 'paid' });
const now = new Date('2030-01-01T00:00:00Z');
test('checkout validates exact money and freezes only whitelisted public booking details', () => {
  const result = validate(input(), {}, now);
  assert.equal(result.amountMinor, '115680');
  assert.equal(result.expiresAt, '2030-01-08T00:00:00.000Z');
  assert.equal(result.snapshot.internalNotes, undefined); assert.equal(result.paymentStatus, undefined);
  assert.equal(validate({ ...input(), amount: '0.01' }, {}, now).amountMinor, '1');
  assert.equal(validate({ ...input(), amount: '999999999.99', currency: 'UZS' }, {}, now).amountMinor, '99999999999');
});
test('checkout rejects invalid values before saving', () => {
  for (const change of [{ amount: 42 }, { amount: '-1' }, { amount: '0' }, { amount: '1.001' }, { amount: '1e2' }, { currency: 'EUR' }, { expiryDays: 0 }, { expiryDays: 31 }, { passengers: 0 }, { passengers: 10 }, { departureDate: '2029-01-01' }, { departureDate: '2030-02-30' }, { returnDate: '2030-05-01' }, { fareTerms: ' ' }, { language: 'de' }, { requestId: 'anything' }]) assert.throws(() => validate({ ...input(), ...change }, {}, now));
});
test('checkout links use only a configured trustworthy website origin', () => {
  const previous = process.env.PUBLIC_WEBSITE_URL;
  try {
    for (const value of ['', 'javascript:alert(1)', 'http://example.com', 'https://user:password@example.com', 'https://example.com/?x=1', 'https://example.com/path', 'https://example.com/#a']) { process.env.PUBLIC_WEBSITE_URL = value; assert.throws(websiteOrigin); }
    process.env.PUBLIC_WEBSITE_URL = 'https://travel.example.com'; assert.equal(websiteOrigin(), 'https://travel.example.com');
    process.env.PUBLIC_WEBSITE_URL = 'http://localhost:3000'; assert.equal(websiteOrigin(), 'http://localhost:3000');
  } finally { if (previous == null) delete process.env.PUBLIC_WEBSITE_URL; else process.env.PUBLIC_WEBSITE_URL = previous; }
});
test('unguessable token lookup never reveals a lead or agent fields', async () => {
  const token = crypto.randomBytes(32).toString('base64url'); assert(tokenValid(token)); assert.equal(token.length, 43);
  let query;
  const snapshot = validate(input(), {}, now).snapshot;
  const row = { lead: { id: 1, phone: 'private', notes: 'secret' }, snapshot, currency: 'USD', amountMinor: '115680', expiresAt: '2099-01-01', token, createdByAgent: '1' };
  const strapi = { db: { query: () => ({ findOne: async options => { query = options; return row; } }) } };
  const result = await publicCheckout(strapi, token);
  assert.equal(query.where.tokenHash, hashToken(token));
  assert.deepEqual(Object.keys(result).sort(), ['amountMinor', 'booking', 'currency', 'expiresAt', 'paymentsEnabled']);
  assert.equal(result.paymentsEnabled, false); assert(!JSON.stringify(result).includes('secret'));
  await assert.rejects(publicCheckout(strapi, '123456'), { status: 404 });
  row.revokedAt = '2030-01-01'; await assert.rejects(publicCheckout(strapi, token), { status: 404 });
  delete row.revokedAt; row.expiresAt = '2000-01-01'; await assert.rejects(publicCheckout(strapi, token), { status: 404 });
  row.expiresAt = '2099-01-01'; row.lead = null; await assert.rejects(publicCheckout(strapi, token), { status: 404 });
});
test('expired and revoked links cannot remain active', () => {
  assert.equal(state({ expiresAt: '2030-01-01' }, now), 'expired');
  assert.equal(state({ expiresAt: '2031-01-01', revokedAt: '2030-01-01' }, now), 'revoked');
  assert.equal(state({ expiresAt: '2031-01-01' }, now), 'active');
});
test('all agent checkout routes require authenticated admins, checkout permission and lead read access', async () => {
  let routes;
  registerCheckoutRoutes({ server: { routes: value => { routes = value; } } });
  for (const route of routes.routes) {
    assert.equal(route.config.policies[0], 'admin::isAuthenticatedAdmin');
    assert.deepEqual(route.config.policies[1].config.actions, ['api::checkout.manage']);
    const ctx = { set() {}, state: { userAbility: { can: () => false } } };
    await route.handler(ctx); assert.equal(ctx.status, 403);
  }
});
