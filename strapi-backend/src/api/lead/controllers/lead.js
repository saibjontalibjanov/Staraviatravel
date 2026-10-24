'use strict';
const { IntakeError, saveApplication } = require('../services/intake');

module.exports = {
  async create(ctx) {
    try {
      const lead = await saveApplication(strapi.documents('api::lead.lead'), ctx.request.body?.data);
      ctx.status = 201;
      ctx.body = { data: { clientId: lead.clientId, createdAt: lead.createdAt } };
    } catch (error) {
      if (error instanceof IntakeError) return ctx.badRequest(error.message);
      strapi.log.error('Lead application could not be saved.');
      return ctx.internalServerError('Your application could not be saved. Please try again.');
    }
  },
};
