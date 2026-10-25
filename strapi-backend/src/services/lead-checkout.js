'use strict';
const { randomBytes, createHash } = require('node:crypto');
const UID = 'api::checkout.checkout';
const action = 'api::checkout.manage';
class CheckoutError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const hashToken = token => createHash('sha256').update(token).digest('hex');
const tokenValid = token => typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
function websiteOrigin() {
  const raw = process.env.PUBLIC_WEBSITE_URL;
  if (!raw) throw new CheckoutError('Set PUBLIC_WEBSITE_URL to the public website origin before creating checkout links.', 503);
  let url;
  try { url = new URL(raw); } catch { throw new CheckoutError('PUBLIC_WEBSITE_URL is invalid.', 503); }
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new CheckoutError('PUBLIC_WEBSITE_URL must be an HTTPS origin (HTTP localhost is allowed for development).', 503);
  return url.origin;
}
function text(value, max, label, required = false) {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new CheckoutError(`Invalid ${label}.`);
  return value.trim();
}
function date(value, required) {
  if (!value && !required) return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new CheckoutError('Invalid travel date.');
  return value;
}
function validate(input, lead, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CheckoutError('Invalid checkout details.');
  if (!['USD', 'UZS'].includes(input.currency)) throw new CheckoutError('Choose USD or UZS.');
  // Convert a decimal string to minor units without floating-point rounding.
  if (typeof input.amount !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(input.amount)) throw new CheckoutError('Enter a positive amount with at most two decimal places.');
  const [whole, fraction = ''] = input.amount.split('.');
  const amountMinor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (amountMinor < 1 || amountMinor > 99999999999) throw new CheckoutError('Invalid checkout amount.');
  if (!Number.isInteger(input.expiryDays) || input.expiryDays < 1 || input.expiryDays > 30) throw new CheckoutError('Link validity must be 1–30 days.');
  if (typeof input.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw new CheckoutError('Invalid creation reference.');
  const departureDate = date(input.departureDate, true);
  const returnDate = date(input.returnDate, false);
  if (departureDate < now.toISOString().slice(0, 10) || (returnDate && returnDate < departureDate)) throw new CheckoutError('Check the departure and return dates.');
  if (!Number.isInteger(input.passengers) || input.passengers < 1 || input.passengers > 9) throw new CheckoutError('Choose 1–9 passengers.');
  if (!['uz', 'ru', 'en'].includes(input.language)) throw new CheckoutError('Invalid checkout language.');
  return {
    amountMinor: String(amountMinor), currency: input.currency, requestId: input.requestId,
    expiresAt: new Date(now.getTime() + input.expiryDays * 86400000).toISOString(),
    snapshot: {
      route: text(input.route, 200, 'route', true), airline: text(input.airline, 100, 'airline'),
      passengerName: text(input.passengerName, 200, 'passenger name', true), passengers: input.passengers,
      departureDate, returnDate, cabin: text(input.cabin, 50, 'cabin', true),
      fareTerms: text(input.fareTerms, 5000, 'fare and refund terms', true), language: input.language,
    },
  };
}
function state(row, now = new Date()) { return row.revokedAt ? 'revoked' : new Date(row.expiresAt) <= now ? 'expired' : 'active'; }
function adminView(row, origin) {
  return { id: row.id, snapshot: row.snapshot, amountMinor: String(row.amountMinor), currency: row.currency, createdAt: row.createdAt, expiresAt: row.expiresAt, status: state(row), url: state(row) === 'active' ? `${origin}/checkout/${row.token}` : null };
}
function publicView(row) {
  return { booking: row.snapshot, amountMinor: String(row.amountMinor), currency: row.currency, expiresAt: row.expiresAt, paymentsEnabled: false };
}
async function publicCheckout(strapi, token) {
  if (!tokenValid(token)) throw new CheckoutError('Checkout not found or no longer available.', 404);
  const row = await strapi.db.query(UID).findOne({ where: { tokenHash: hashToken(token) }, populate: { lead: true } });
  if (!row || !row.lead || state(row) !== 'active') throw new CheckoutError('Checkout not found or no longer available.', 404);
  return publicView(row);
}
async function registerCheckoutPermission(strapi) {
  await strapi.admin.services.permission.actionProvider.registerMany([{ section: 'settings', category: 'Checkout', displayName: 'Create and revoke checkout links', uid: 'checkout.manage' }]);
}
function registerCheckoutRoutes(strapi) {
  const config = { policies: ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: [action] } }] };
  const safe = handler => async ctx => {
    ctx.set('Cache-Control', 'no-store');
    try {
      if (!ctx.state.userAbility.can('plugin::content-manager.explorer.read', 'api::lead.lead')) throw new CheckoutError('Lead read permission is required.', 403);
      await handler(ctx);
    } catch (error) {
      ctx.status = error instanceof CheckoutError ? error.status : 500;
      ctx.body = { error: { message: error instanceof CheckoutError ? error.message : 'Checkout operation failed. Please retry.' } };
    }
  };
  const findLead = async clientId => {
    if (!/^[1-9]\d{5}$/.test(clientId)) throw new CheckoutError('Invalid client ID.');
    const lead = await strapi.db.query('api::lead.lead').findOne({ where: { clientId } });
    if (!lead) throw new CheckoutError('Lead not found.', 404);
    return lead;
  };
  strapi.server.routes({ type: 'admin', prefix: '/admin/lead-checkouts', routes: [
    { method: 'GET', path: '/:clientId', config, handler: safe(async ctx => {
      const lead = await findLead(ctx.params.clientId);
      const rows = await strapi.db.query(UID).findMany({ where: { lead: { id: lead.id } }, orderBy: { id: 'desc' }, limit: 100 });
      let origin = ''; let configurationError = '';
      try { origin = websiteOrigin(); } catch (error) { configurationError = error.message; }
      ctx.body = { checkouts: rows.map(row => ({ ...adminView(row, origin), ...(!origin ? { url: null } : {}) })), configurationError };
    }) },
    { method: 'POST', path: '/:clientId', config, handler: safe(async ctx => {
      const origin = websiteOrigin();
      const lead = await findLead(ctx.params.clientId);
      const data = validate(ctx.request.body, lead);
      const existing = await strapi.db.query(UID).findOne({ where: { requestId: data.requestId }, populate: { lead: true } });
      if (existing) {
        if (existing.lead?.id !== lead.id) throw new CheckoutError('Creation reference already used.');
        ctx.body = { checkout: adminView(existing, origin) }; return;
      }
      const token = randomBytes(32).toString('base64url');
      let row;
      try { row = await strapi.db.query(UID).create({ data: { ...data, lead: lead.id, token, tokenHash: hashToken(token), createdByAgent: String(ctx.state.user.id) } }); }
      catch (error) {
        const duplicate = await strapi.db.query(UID).findOne({ where: { requestId: data.requestId }, populate: { lead: true } });
        if (!duplicate || duplicate.lead?.id !== lead.id) throw error;
        row = duplicate;
      }
      ctx.status = 201; ctx.body = { checkout: adminView(row, origin) };
    }) },
    { method: 'POST', path: '/:clientId/:id/revoke', config, handler: safe(async ctx => {
      const lead = await findLead(ctx.params.clientId);
      if (!/^[1-9]\d*$/.test(ctx.params.id)) throw new CheckoutError('Invalid checkout.');
      const row = await strapi.db.query(UID).findOne({ where: { id: ctx.params.id, lead: { id: lead.id } } });
      if (!row) throw new CheckoutError('Checkout not found.', 404);
      await strapi.db.query(UID).update({ where: { id: row.id }, data: { revokedAt: row.revokedAt || new Date().toISOString() } });
      ctx.body = { revoked: true };
    }) },
  ] });
}
module.exports = { UID, CheckoutError, validate, hashToken, tokenValid, websiteOrigin, state, publicView, publicCheckout, registerCheckoutPermission, registerCheckoutRoutes };
