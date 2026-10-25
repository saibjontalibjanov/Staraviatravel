'use strict';
module.exports = { routes: [{ method: 'GET', path: '/checkouts/:token', handler: 'checkout.findByToken', config: { auth: false, middlewares: ['global::lead-rate-limit'] } }] };
