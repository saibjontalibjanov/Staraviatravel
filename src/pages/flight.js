'use strict';

const axios = require('axios');

module.exports = {
  async search(ctx) {
    try {
      const { from, to, departureDate, returnDate, passengers, cabin } = ctx.request.body;

      // Validation: Ensure required fields are present
      if (!from || !to || !departureDate) {
          return ctx.badRequest('Origin (from), destination (to), and departureDate are required.');
      }

    const slices = [{
      origin: from,
      destination: to,
      departure_date: departureDate,
    }];

    if (returnDate) {
      slices.push({
        origin: to,
        destination: from,
        departure_date: returnDate,
      });
    }

      const response = await axios.post('https://api.duffel.com/air/offer_requests', {
        data: {
          slices,
          passengers: Array.from({ length: parseInt(passengers) || 1 }).map(() => ({ type: 'adult' })),
          cabin_class: cabin || 'economy',
        },
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DUFFEL_API_TOKEN}`, // .env dan token olinadi
          'Duffel-Version': 'v1',
          'Content-Type': 'application/json',
        },
      });

      ctx.body = { data: response.data.data };
    } catch (error) {
      // Log the exact error from Duffel in your terminal to debug
      console.error('Duffel API Error Details:', JSON.stringify(error.response?.data, null, 2));

      const status = error.response?.status || 500;
      const message = error.response?.data?.errors?.[0]?.message || error.message;
      ctx.throw(status, message);
    }
  },
};