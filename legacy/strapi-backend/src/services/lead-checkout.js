'use strict';
const { randomBytes, createHash } = require('node:crypto');
const UID = 'api::checkout.checkout';
const action = 'api::checkout.manage';
const { CheckoutError, validate, validatePassports, validateBilling } = require('./checkout-data');
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
function state(row, now = new Date()) { return row.revokedAt ? 'revoked' : new Date(row.expiresAt) <= now ? 'expired' : 'active'; }
function adminView(row, origin) {
  return { id: row.id, snapshot: row.snapshot, pricing: row.pricing, billingContact: row.billingContact, amountMinor: String(row.amountMinor), currency: row.currency, createdAt: row.createdAt, expiresAt: row.expiresAt, status: state(row), url: state(row) === 'active' ? `${origin}/checkout/${row.token}` : null };
}
function publicView(row) {
  return { booking: Object.fromEntries(['version','clientId','route','tripType','journeys','baggage','passengerDetails','passengerName','passengers','departureDate','returnDate','cabin','airline','fareTerms','paymentInformation','language'].filter(key => row.snapshot[key] !== undefined).map(key => [key, row.snapshot[key]])), amountMinor: String(row.amountMinor), currency: row.currency, expiresAt: row.expiresAt, paymentsEnabled: false };
}
async function activeCheckout(strapi, token) {
  if (!tokenValid(token)) throw new CheckoutError('Checkout not found or no longer available.', 404);
  const row = await strapi.db.query(UID).findOne({ where: { tokenHash: hashToken(token) }, populate: { lead: true } });
  if (!row || !row.lead || state(row) !== 'active') throw new CheckoutError('Checkout not found or no longer available.', 404);
  return row;
}
async function publicCheckout(strapi, token) { return publicView(await activeCheckout(strapi, token)); }
async function saveBilling(strapi, token, input) {
  const row = await activeCheckout(strapi, token);
  const billingContact = validateBilling(input, row.snapshot);
  // Recheck the link at write time so an already-revoked/expired checkout cannot accept details.
  const result = await strapi.db.query(UID).updateMany({ where: { id: row.id, revokedAt: { $null: true }, expiresAt: { $gt: new Date().toISOString() } }, data: { billingContact } });
  if (!result.count) throw new CheckoutError('Checkout not found or no longer available.', 404);
  return { saved: true };
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
    { method: 'GET', path: '/:clientId/passports', config, handler: safe(async ctx => {
      const lead = await findLead(ctx.params.clientId); ctx.body = { passengers: lead.passportDetails || [] };
    }) },
    { method: 'PUT', path: '/:clientId/passports', config, handler: safe(async ctx => {
      const lead = await findLead(ctx.params.clientId);
      const passengers = validatePassports(ctx.request.body?.passengers);
      await strapi.db.query('api::lead.lead').update({ where: { id: lead.id }, data: { passportDetails: passengers } });
      ctx.body = { passengers };
    }) },
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
      const input = ctx.request.body;
      const existing = await strapi.db.query(UID).findOne({ where: { requestId: input?.requestId || 'invalid' }, populate: { lead: true } });
      if (existing) {
        if (existing.lead?.id !== lead.id) throw new CheckoutError('Creation reference already used.');
        ctx.body = { checkout: adminView(existing, origin) }; return;
      }
      const quote = typeof input?.quoteReference === 'string' ? await strapi.db.query('api::ticket-quote.ticket-quote').findOne({ where: { reference: input.quoteReference, lead: { id: lead.id } } }) : null;
      const data = validate(input, lead, new Date(), quote);
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
module.exports = { UID, CheckoutError, validate, hashToken, tokenValid, websiteOrigin, state, publicView, publicCheckout, saveBilling, registerCheckoutPermission, registerCheckoutRoutes };
