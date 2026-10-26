'use strict';
const { CHAT, MESSAGE, TelegramError, configuration, callTelegram, queueMessage } = require('./telegram');
const policy = action => ({ policies: ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: [action] } }] });
const actions = { read: 'api::telegram.read', reply: 'api::telegram.reply', configure: 'api::telegram.configure' };
const validChatId = value => typeof value === 'string' && /^-?\d{1,20}$/.test(value);
const messageView = message => ({ id: message.id, text: message.text, direction: message.direction, senderName: message.senderName, deliveryStatus: message.deliveryStatus, lastError: message.lastError, createdAt: message.createdAt, clientId: message.clientId });

async function registerTelegramPermissions(strapi) {
  await strapi.admin.services.permission.actionProvider.registerMany([
    { section: 'settings', category: 'Telegram', displayName: 'Read conversations', uid: 'telegram.read' },
    { section: 'settings', category: 'Telegram', displayName: 'Reply and link leads', uid: 'telegram.reply' },
    { section: 'settings', category: 'Telegram', displayName: 'Configure webhook', uid: 'telegram.configure' },
  ]);
}

function registerTelegramRoutes(strapi) {
  const safe = handler => async ctx => {
    try { await handler(ctx); }
    catch (error) {
      ctx.status = error instanceof TelegramError ? error.status : 500;
      ctx.body = { error: { message: error instanceof TelegramError ? error.message : 'Telegram operation failed. Please retry.' } };
    }
  };
  const getChat = async chatId => {
    if (!validChatId(chatId)) throw new TelegramError('Invalid Telegram chat ID.');
    const chat = await strapi.db.query(CHAT).findOne({ where: { chatId } });
    if (!chat) throw new TelegramError('Conversation not found.', 404);
    return chat;
  };
  strapi.server.routes({ type: 'admin', prefix: '/admin/telegram', routes: [
    { method: 'GET', path: '/status', config: policy(actions.read), handler: safe(async ctx => {
      const config = configuration();
      ctx.body = { canReply: ctx.state.userAbility.can(actions.reply), canConfigure: ctx.state.userAbility.can(actions.configure), canLinkLead: ctx.state.userAbility.can(actions.reply) && ctx.state.userAbility.can('plugin::content-manager.explorer.read', 'api::lead.lead'), botConfigured: Boolean(config.token), notificationsConfigured: Boolean(config.token && config.target), webhookSecretConfigured: Boolean(config.secret), publicUrlConfigured: Boolean(config.publicUrl), webhookUrl: config.publicUrl ? `${config.publicUrl}/api/telegram/webhook` : null,
        failedDeliveries: await strapi.db.query(MESSAGE).count({ where: { deliveryStatus: { $in: ['failed', 'unknown'] } } }) };
    }) },
    { method: 'POST', path: '/connect', config: policy(actions.configure), handler: safe(async ctx => {
      const config = configuration();
      if (!config.secret || !config.publicUrl) throw new TelegramError('Configure a public HTTPS PUBLIC_STRAPI_URL and a 16–256 character TELEGRAM_WEBHOOK_SECRET on the server.', 503);
      await callTelegram('setWebhook', { url: `${config.publicUrl}/api/telegram/webhook`, secret_token: config.secret, allowed_updates: ['message'], drop_pending_updates: false });
      ctx.body = { connected: true, webhookUrl: `${config.publicUrl}/api/telegram/webhook` };
    }) },
    { method: 'GET', path: '/webhook', config: policy(actions.configure), handler: safe(async ctx => {
      const info = await callTelegram('getWebhookInfo', {});
      // Do not relay raw provider errors or arbitrary webhook URLs that may contain somebody else's secrets.
      const expected = configuration().publicUrl;
      ctx.body = { configuredForThisServer: Boolean(expected && info.url === `${expected}/api/telegram/webhook`), pendingUpdates: info.pending_update_count || 0, lastError: Boolean(info.last_error_date) };
    }) },
    { method: 'GET', path: '/chats', config: policy(actions.read), handler: safe(async ctx => {
      const page = /^\d+$/.test(String(ctx.query.page || '1')) ? Math.min(100000, Math.max(1, Number(ctx.query.page || 1))) : 1;
      const query = typeof ctx.query.q === 'string' ? ctx.query.q.trim().slice(0, 100) : '';
      const where = query ? { $or: ['displayName', 'username', 'chatId', 'clientId'].map(key => ({ [key]: { $containsi: query } })) } : {};
      const [chats, total] = await Promise.all([strapi.db.query(CHAT).findMany({ where, orderBy: [{ lastMessageAt: 'desc' }, { id: 'desc' }], limit: 25, offset: (page - 1) * 25 }), strapi.db.query(CHAT).count({ where })]);
      ctx.body = { chats: chats.map(chat => ({ chatId: chat.chatId, displayName: chat.displayName, username: chat.username, chatType: chat.chatType, clientId: chat.clientId, preview: chat.preview, lastMessageAt: chat.lastMessageAt, unread: Boolean(chat.lastInboundAt && (!chat.lastReadAt || new Date(chat.lastInboundAt) > new Date(chat.lastReadAt))) })), page, pageCount: Math.max(1, Math.ceil(total / 25)), total };
    }) },
    { method: 'GET', path: '/chats/:chatId/messages', config: policy(actions.read), handler: safe(async ctx => {
      const chat = await getChat(ctx.params.chatId);
      const before = ctx.query.before;
      if (before && !/^[1-9]\d*$/.test(String(before))) throw new TelegramError('Invalid message cursor.');
      const messages = await strapi.db.query(MESSAGE).findMany({ where: { chatId: chat.chatId, ...(before ? { id: { $lt: Number(before) } } : {}) }, orderBy: { id: 'desc' }, limit: 51 });
      const hasMore = messages.length > 50;
      const page = messages.slice(0, 50).reverse();
      if (!before && page.length) await strapi.db.query(CHAT).update({ where: { id: chat.id }, data: { lastReadAt: page[page.length - 1].createdAt } });
      ctx.body = { chat: { chatId: chat.chatId, displayName: chat.displayName, clientId: chat.clientId, username: chat.username, chatType: chat.chatType }, messages: page.map(messageView), hasMore };
    }) },
    { method: 'POST', path: '/chats/:chatId/messages', config: policy(actions.reply), handler: safe(async ctx => {
      const chat = await getChat(ctx.params.chatId);
      const { text, requestId } = ctx.request.body || {};
      if (typeof text !== 'string' || !text.trim() || text.trim().length > 4096) throw new TelegramError('Enter a message between 1 and 4096 characters.');
      if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new TelegramError('A valid message submission ID is required.');
      if (!configuration().token) throw new TelegramError('Configure TELEGRAM_BOT_TOKEN on the server before replying.', 503);
      const user = ctx.state.user;
      const message = await queueMessage(strapi, { eventKey: `reply:${chat.chatId}:${requestId}`, chatId: chat.chatId, text: text.trim(), senderName: [user.firstname, user.lastname].filter(Boolean).join(' '), agentId: String(user.id) });
      ctx.status = 202; ctx.body = { message: messageView(message) };
    }) },
    { method: 'POST', path: '/messages/:id/retry', config: policy(actions.reply), handler: safe(async ctx => {
      if (!/^[1-9]\d*$/.test(ctx.params.id)) throw new TelegramError('Invalid message ID.');
      const message = await strapi.db.query(MESSAGE).findOne({ where: { id: Number(ctx.params.id) } });
      if (!message || message.direction !== 'outgoing') throw new TelegramError('Outgoing message not found.', 404);
      if (!['failed', 'unknown'].includes(message.deliveryStatus)) throw new TelegramError('This message is already queued or delivered.', 409);
      if (message.deliveryStatus === 'unknown' && ctx.request.body?.confirmUncertain !== true) throw new TelegramError('Check Telegram and confirm before retrying an unconfirmed delivery.', 409);
      if (!configuration().token) throw new TelegramError('Configure TELEGRAM_BOT_TOKEN before retrying.', 503);
      const table = strapi.db.metadata.get(MESSAGE).tableName;
      const updated = await strapi.db.connection(table).where({ id: message.id, delivery_status: message.deliveryStatus }).update({ delivery_status: 'pending', attempts: 0, next_attempt_at: null, last_error: null, updated_at: new Date() });
      if (!updated) throw new TelegramError('Message status changed. Refresh before retrying.', 409);
      ctx.status = 202; ctx.body = { queued: true };
    }) },
    { method: 'PUT', path: '/chats/:chatId/lead', config: { policies: [...policy(actions.reply).policies, { name: 'admin::hasPermissions', config: { actions: [['plugin::content-manager.explorer.read', 'api::lead.lead']] } }] }, handler: safe(async ctx => {
      const chat = await getChat(ctx.params.chatId);
      const clientId = ctx.request.body?.clientId;
      if (clientId !== null && (typeof clientId !== 'string' || !/^[1-9]\d{5}$/.test(clientId))) throw new TelegramError('Enter a six-digit client ID, or clear it to unlink.');
      if (clientId && !await strapi.db.query('api::lead.lead').findOne({ where: { clientId } })) throw new TelegramError('Lead not found.', 404);
      await strapi.db.query(CHAT).update({ where: { id: chat.id }, data: { clientId } });
      ctx.body = { clientId };
    }) },
  ] });
}

module.exports = { actions, registerTelegramPermissions, registerTelegramRoutes };
