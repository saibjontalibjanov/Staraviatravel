'use strict';
const { createCoreRouter } = require('@strapi/strapi').factories;
module.exports = createCoreRouter('api::card-flights.card-flights', {
  config: { find: { auth: false }, findOne: { auth: false } },
});
