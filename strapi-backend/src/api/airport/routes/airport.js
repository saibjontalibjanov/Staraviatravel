module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/airports',
      handler: 'airport.getAirports',
      config: {
        auth: false,
      },
    },
  ],
};
