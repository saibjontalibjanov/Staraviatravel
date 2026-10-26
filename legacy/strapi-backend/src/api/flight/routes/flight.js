module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/flights',
      handler: 'flight.getFlights',
      config: {
        auth: false, // Hamma uchun ochiq qilish (yoki ehtiyojga qarab token talab qilish)
      },
    },
  ],
};