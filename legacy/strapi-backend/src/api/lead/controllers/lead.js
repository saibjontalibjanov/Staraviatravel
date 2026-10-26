'use strict';
const { IntakeError, saveApplication } = require('../services/intake');
const { enqueueLeadNotification } = require('../../../services/telegram');

module.exports = {
  async create(ctx) {
    try {
      const lead = await saveApplication(strapi.documents('api::lead.lead'), ctx.request.body?.data);
      try { await enqueueLeadNotification(strapi, lead); }
      catch { strapi.log.error('Lead was saved, but its Telegram notification could not be queued.'); }
      ctx.status = 201;
      ctx.body = { data: { clientId: lead.clientId, createdAt: lead.createdAt } };
    } catch (error) {
      if (error instanceof IntakeError) return ctx.badRequest(error.message);
      strapi.log.error('Lead application could not be saved.');
      return ctx.internalServerError('Your application could not be saved. Please try again.');
    }
  },
};
