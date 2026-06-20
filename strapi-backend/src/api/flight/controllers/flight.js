module.exports = {
  async getFlights(ctx) {
    try {
      // React'dan kelgan so'rov parametrlari (JFK, DXB, sana)
      const { departure_id, arrival_id, date } = ctx.query;
      const apiKey = process.env.SERPAPI_KEY;

      const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${departure_id}&arrival_id=${arrival_id}&outbound_date=${date}&type=1&api_key=${apiKey}`;

      // SerpApi'ga murojaat qilish
      const response = await fetch(url);
      const data = await response.json();

      // Ma'lumotlarni manipulatsiya qilish (Aviakompaniyani yashirish, narxni o'zgartirish)
      if (data.best_flights) {
        const secretFlights = data.best_flights.map(flight => {
          return {
            id: flight.flights[0].flight_number, // Asil ID ni saqlab qolamiz
            route: `${departure_id} - ${arrival_id}`,
            class: "Business Class",
            displayPrice: 4589, // O'zgartirilgan narx logikangiz
          };
        });

        // React'ga faqat filtrlangan va arzonlashtirilgan chiptalarni yuborish
        return ctx.send(secretFlights);
      }

      return ctx.send([]);
    } catch (error) {
      return ctx.internalServerError('Chiptalarni olishda xatolik yuz berdi');
    }
  }
};