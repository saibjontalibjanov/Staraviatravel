'use strict';

const axios = require('axios');
const { getJson } = require("serpapi");

module.exports = {
  async search(ctx) {
    const { from, to, departureDate, returnDate, passengers, cabin } = ctx.request.body;

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

    try {
      const response = await axios.post('https://api.duffel.com/air/offer_requests', {
        data: {
          slices,
          passengers: Array.from({ length: passengers }).map(() => ({ type: 'adult' })),
          cabin_class: cabin,
        },
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DUFFEL_API_TOKEN}`, // .env dan token olinadi
          'Duffel-Version': 'v1',
          'Content-Type': 'application/json',
        },
      });

      // Duffel'dan kelgan natijani to'g'ridan-to'g'ri frontendga qaytaramiz
      return { data: response.data.data };
    } catch (error) {
      ctx.throw(error.response?.status || 500, error.response?.data || error.message);
    }
  },
};