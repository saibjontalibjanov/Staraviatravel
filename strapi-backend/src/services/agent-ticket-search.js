'use strict';
const airports = require('../api/airport/airports-data.json');
const { FlightSearchError, searchFlights } = require('./flight-search');

const permission = 'api::ticket-search.search';
const protectedConfig = {
  policies: ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: [permission] } }],
};

async function registerAgentSearchPermission(strapi) {
  await strapi.admin.services.permission.actionProvider.registerMany([{
    section: 'settings', category: 'Ticket Search', displayName: 'Search tickets', uid: 'ticket-search.search',
  }]);
}

function registerAgentSearchRoutes(strapi) {
  strapi.server.routes({
    type: 'admin', prefix: '/admin/ticket-search',
    routes: [
      { method: 'GET', path: '/airports', config: protectedConfig, handler: async ctx => {
        const query = typeof ctx.query.q === 'string' ? ctx.query.q.trim().toLowerCase().slice(0, 100) : '';
        ctx.body = { airports: query.length < 2 ? [] : airports.filter(airport => airport.code && [airport.code, airport.city, airport.name, airport.country].some(value => typeof value === 'string' && value.toLowerCase().includes(query))).sort((a, b) => Number(b.code.toLowerCase() === query) - Number(a.code.toLowerCase() === query)).slice(0, 25) };
      } },
      { method: 'POST', path: '/flights', config: protectedConfig, handler: async ctx => {
        try {
          ctx.body = await searchFlights(ctx.request.body);
        } catch (error) {
          ctx.status = error instanceof FlightSearchError ? error.status : 500;
          ctx.body = { error: { status: ctx.status, message: error instanceof FlightSearchError ? error.message : 'Flight search failed. Please try again.' } };
        }
      } },
    ],
  });
}

module.exports = { registerAgentSearchPermission, registerAgentSearchRoutes, permission };
