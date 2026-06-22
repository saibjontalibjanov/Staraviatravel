const axios = require('axios');

module.exports = {
  async getFlights(ctx) {
    try {
      const { departure_id, arrival_id, date, return_date, cabin } = ctx.query;
      const apiKey = process.env.SERPAPI_KEY;

      // Parametrlarni tekshirish
      if (!departure_id || !arrival_id || !date) {
        return ctx.badRequest('departure_id, arrival_id va date parametrlari kerak');
      }

      if (!apiKey) {
        return ctx.internalServerError('SERPAPI_KEY .env faylida topilmadi');
      }

      // Cabin class mapping for SerpAPI
      const cabinMap = {
        'economy': 1,
        'premium economy': 2,
        'business': 3,
        'first': 4,
      };
      const travelClass = cabinMap[(cabin || 'economy').toLowerCase()] || 1;

      // SerpApi'ga murojaat
      const isRoundTrip = !!return_date;
      const params = {
        engine: 'google_flights',
        departure_id: departure_id,
        arrival_id: arrival_id,
        outbound_date: date,
        type: isRoundTrip ? 1 : 2, // 1 = round-trip, 2 = one-way
        travel_class: travelClass,
        currency: 'USD',
        hl: 'en',
        api_key: apiKey,
      };

      if (isRoundTrip) {
        params.return_date = return_date;
      }

      const response = await axios.get('https://serpapi.com/search.json', { params });

      const data = response.data;

      // Debug uchun — agar natija bo'sh bo'lsa console'da ko'ring
      console.log('SerpAPI response keys:', Object.keys(data));
      console.log('best_flights count:', data.best_flights?.length || 0);
      console.log('other_flights count:', data.other_flights?.length || 0);

      // Barcha parvozlarni yig'ish (best + other)
      const allFlights = [
        ...(data.best_flights || []),
        ...(data.other_flights || []),
      ];

      if (allFlights.length === 0) {
        // Xatolik bo'lsa uni qaytaramiz
        if (data.error) {
          return ctx.send({ flights: [], error: data.error });
        }
        return ctx.send({ flights: [], message: 'Parvozlar topilmadi' });
      }

      // Ma'lumotlarni frontend uchun formatlash
      const formattedFlights = allFlights.map((flight, index) => {
        const firstLeg = flight.flights?.[0] || {};
        const lastLeg = flight.flights?.[flight.flights.length - 1] || {};

        return {
          id: index + 1,
          airline: firstLeg.airline || 'Unknown Airline',
          airlineLogo: firstLeg.airline_logo || null,
          flightNumber: firstLeg.flight_number || '',
          departure: {
            airport: firstLeg.departure_airport?.name || departure_id,
            code: firstLeg.departure_airport?.id || departure_id,
            time: firstLeg.departure_airport?.time || '',
          },
          arrival: {
            airport: lastLeg.arrival_airport?.name || arrival_id,
            code: lastLeg.arrival_airport?.id || arrival_id,
            time: lastLeg.arrival_airport?.time || '',
          },
          duration: flight.total_duration || 0,
          stops: flight.flights?.length > 1 ? flight.flights.length - 1 : 0,
          price: flight.price || null,
          cabin: firstLeg.travel_class || 'Economy',
          type: flight.type || 'one-way',
        };
      });

      return ctx.send({ flights: formattedFlights });
    } catch (error) {
      console.error('Flight search error:', error.message);
      
      // Axios xatoligini tekshirish
      if (error.response) {
        console.error('SerpAPI status:', error.response.status);
        console.error('SerpAPI data:', error.response.data);
        return ctx.internalServerError(
          `SerpAPI xatolik: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`
        );
      }

      return ctx.internalServerError('Chiptalarni olishda xatolik yuz berdi: ' + error.message);
    }
  },
};
