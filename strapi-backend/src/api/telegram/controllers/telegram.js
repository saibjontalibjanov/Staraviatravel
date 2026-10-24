'use strict';
const { TelegramError, configuration, verifyWebhookSecret, ingestUpdate } = require('../../../services/telegram');

module.exports = {
  async webhook(ctx) {
    const config = configuration();
    if (!config.secret) { ctx.status = 503; ctx.body = { error: { message: 'Telegram webhook is not configured.' } }; return; }
    if (!verifyWebhookSecret(ctx.get('X-Telegram-Bot-Api-Secret-Token'), config.secret)) return ctx.unauthorized('Invalid webhook authentication.');
    try { ctx.body = await ingestUpdate(strapi, ctx.request.body); }
    catch (error) {
      ctx.status = error instanceof TelegramError ? error.status : 500;
      ctx.body = { error: { message: error instanceof TelegramError ? error.message : 'Could not save Telegram update. Please retry.' } };
    }
  },
};
