'use strict';
const { createCoreController } = require('@strapi/strapi').factories;
module.exports = createCoreController('api::card-flights.card-flights', () => ({
  async find(ctx) { ctx.query = { ...ctx.query, status: 'published' }; return super.find(ctx); },
  async findOne(ctx) { ctx.query = { ...ctx.query, status: 'published' }; return super.findOne(ctx); },
}));
