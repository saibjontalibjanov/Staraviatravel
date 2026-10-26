'use strict';
module.exports = { routes: [{ method: 'POST', path: '/checkouts/:token/billing', handler: 'checkout.saveBilling', config: { auth: false, middlewares: ['global::lead-rate-limit'] } }, { method: 'GET', path: '/checkouts/:token', handler: 'checkout.findByToken', config: { auth: false, middlewares: ['global::lead-rate-limit'] } }] };
