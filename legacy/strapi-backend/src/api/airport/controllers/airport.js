'use strict';
const catalog = require('../airports-data.json');
// The same bundled catalogue backs agent search and the public picker, without an external-service dependency.
const airports = catalog.filter(airport => airport && typeof airport.code === 'string' && /^[A-Z]{3}$/.test(airport.code) && typeof airport.name === 'string').map(airport => ({ code: airport.code, name: airport.name.trim(), city: typeof airport.city === 'string' ? airport.city : '', country: typeof airport.country === 'string' ? airport.country : '' }));
module.exports = { async getAirports(ctx) { ctx.body = airports; } };
