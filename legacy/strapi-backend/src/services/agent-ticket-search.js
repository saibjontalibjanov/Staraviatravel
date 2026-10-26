'use strict';
const { randomUUID } = require('node:crypto');
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
          const input = ctx.request.body;
          let lead;
          if (input?.clientId !== undefined) {
            if (!ctx.state.userAbility.can('plugin::content-manager.explorer.read', 'api::lead.lead')) { ctx.status = 403; ctx.body = { error: { message: 'Lead read permission is required.' } }; return; }
            if (!/^[1-9]\d{5}$/.test(String(input.clientId))) throw new FlightSearchError('Invalid lead reference.');
            lead = await strapi.db.query('api::lead.lead').findOne({ where: { clientId: input.clientId } });
            if (!lead) throw new FlightSearchError('Lead not found.', 404);
          }
          const result = await searchFlights(input);
          if (lead) {
            await strapi.db.query('api::ticket-quote.ticket-quote').deleteMany({ where: { expiresAt: { $lt: new Date(Date.now()-86400000).toISOString() } } });
            for (const flight of result.flights.slice(0, 100)) {
              if (!(flight.price > 0)) continue;
              const reference = randomUUID();
              const expiresAt = new Date(Date.now()+30*60000).toISOString();
              await strapi.db.query('api::ticket-quote.ticket-quote').create({ data: { reference, expiresAt, lead: lead.id, offer: flight, search: result.search, agentId: String(ctx.state.user.id) } });
              flight.quoteReference = reference; flight.quoteExpiresAt = expiresAt;
            }
          }
          ctx.body = result;
        } catch (error) {
          ctx.status = error instanceof FlightSearchError ? error.status : 500;
          ctx.body = { error: { status: ctx.status, message: error instanceof FlightSearchError ? error.message : 'Flight search failed. Please try again.' } };
        }
      } },
    ],
  });
}

module.exports = { registerAgentSearchPermission, registerAgentSearchRoutes, permission };
