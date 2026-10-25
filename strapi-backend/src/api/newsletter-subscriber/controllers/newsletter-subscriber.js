'use strict';
module.exports = {
  async subscribe(ctx) {
    const input = ctx.request.body?.data;
    if (!input || typeof input.email !== 'string' || input.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || !['uz', 'ru', 'en'].includes(input.language || 'uz')) return ctx.badRequest('Enter a valid email address and language.');
    const email = input.email.trim().toLowerCase();
    const uid = 'api::newsletter-subscriber.newsletter-subscriber';
    try {
      if (!await strapi.db.query(uid).findOne({ where: { email } })) {
        try { await strapi.documents(uid).create({ data: { email, language: input.language || 'uz' } }); }
        catch (error) { if (!await strapi.db.query(uid).findOne({ where: { email } })) throw error; }
      }
      ctx.body = { subscribed: true };
    } catch { ctx.internalServerError('Subscription could not be saved. Please retry.'); }
  },
};
