'use strict';
const { registerAgentSearchPermission, registerAgentSearchRoutes } = require('./services/agent-ticket-search');

const { registerTelegramPermissions, registerTelegramRoutes } = require('./services/agent-telegram');
const { startOutbox } = require('./services/telegram');
const { registerCheckoutPermission, registerCheckoutRoutes } = require('./services/lead-checkout');
let stopTelegram;

module.exports = {
  async register({ strapi }) {
    // Register before Strapi synchronizes the built-in admin roles.
    await registerAgentSearchPermission(strapi);
    await registerTelegramPermissions(strapi);
    await registerCheckoutPermission(strapi);
  },
  bootstrap({ strapi }) {
    registerAgentSearchRoutes(strapi);
    registerTelegramRoutes(strapi);
    registerCheckoutRoutes(strapi);
    stopTelegram = startOutbox(strapi);
  },
  destroy() { stopTelegram?.(); },
};
