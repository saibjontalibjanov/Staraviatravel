'use strict';
const { registerAgentSearchPermission, registerAgentSearchRoutes } = require('./services/agent-ticket-search');

const { registerTelegramPermissions, registerTelegramRoutes } = require('./services/agent-telegram');
const { startOutbox } = require('./services/telegram');
let stopTelegram;

module.exports = {
  async register({ strapi }) {
    // Register before Strapi synchronizes the built-in admin roles.
    await registerAgentSearchPermission(strapi);
    await registerTelegramPermissions(strapi);
  },
  bootstrap({ strapi }) {
    registerAgentSearchRoutes(strapi);
    registerTelegramRoutes(strapi);
    stopTelegram = startOutbox(strapi);
  },
  destroy() { stopTelegram?.(); },
};
