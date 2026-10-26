'use strict';
module.exports = { routes: [{ method: 'POST', path: '/newsletter', handler: 'newsletter-subscriber.subscribe', config: { auth: false, middlewares: ['global::lead-rate-limit'] } }] };
