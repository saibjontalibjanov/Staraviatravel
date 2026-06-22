const axios = require('axios');

let cachedAirports = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

module.exports = {
  async getAirports(ctx) {
    try {
      // Return cached data if still valid
      if (cachedAirports && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        return ctx.send(cachedAirports);
      }

      const response = await axios.get('https://portail-portal.otc-cta.gc.ca/api/Airports');
      const data = response.data;

      // Format and filter — only active airports with IATA codes
      const airports = data
        .filter(a => a.iata && a.active)
        .map(a => ({
          code: a.iata,
          name: a.nameEn,
          city: a.city?.nameEn || '',
          country: a.city?.country?.nameEn || ''
        }));

      // Cache it
      cachedAirports = airports;
      cacheTimestamp = Date.now();

      return ctx.send(airports);
    } catch (error) {
      console.error('Airport fetch error:', error.message);
      return ctx.internalServerError('Aeroportlar ma\'lumotini olishda xatolik: ' + error.message);
    }
  },
};
