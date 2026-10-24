'use strict';
const { FlightSearchError, searchFlights } = require('../../../services/flight-search');

module.exports = {
  async getFlights(ctx) {
    try {
      ctx.body = await searchFlights(ctx.query);
    } catch (error) {
      // Never log Axios errors: their request config can contain the provider API key.
      const status = error instanceof FlightSearchError ? error.status : 500;
      ctx.status = status;
      ctx.body = { error: { status, message: error instanceof FlightSearchError ? error.message : 'Flight search failed. Please try again.' } };
    }
  },
};
