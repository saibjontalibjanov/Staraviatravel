'use strict';
const { registerAgentSearchPermission, registerAgentSearchRoutes } = require('./services/agent-ticket-search');

module.exports = {
  async register({ strapi }) {
    // Register before Strapi synchronizes the built-in admin roles.
    await registerAgentSearchPermission(strapi);
  },
  bootstrap({ strapi }) {
    registerAgentSearchRoutes(strapi);
  },
};
