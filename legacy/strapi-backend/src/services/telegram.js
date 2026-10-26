'use strict';
const axios = require('axios');
const { timingSafeEqual } = require('node:crypto');
const CHAT = 'api::telegram-chat.telegram-chat';
const MESSAGE = 'api::telegram-message.telegram-message';

class TelegramError extends Error {
  constructor(message, status = 400, retryAfter = null, ambiguous = false) {
    super(message); this.status = status; this.retryAfter = retryAfter; this.ambiguous = ambiguous;
  }
}

function configuration(env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN || '';
  const target = env.TELEGRAM_LEADS_CHAT_ID || '';
  const secret = env.TELEGRAM_WEBHOOK_SECRET || '';
  let publicUrl = '';
  try {
    const url = new URL(env.PUBLIC_STRAPI_URL);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash) publicUrl = url.toString().replace(/\/$/, '');
  } catch { /* A public HTTPS URL is required before registering a webhook. */ }
  return { token, target: /^-?\d{1,20}$/.test(target) ? target : '', secret: /^[A-Za-z0-9_-]{16,256}$/.test(secret) ? secret : '', publicUrl };
}

function verifyWebhookSecret(provided, expected) {
  return typeof provided === 'string' && Boolean(expected) && Buffer.byteLength(provided) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

async function callTelegram(method, data, options = {}) {
  const config = options.config || configuration();
  if (!config.token) throw new TelegramError('Telegram bot token is not configured on the server.', 503);
  let response;
  try {
    response = await (options.http || axios).post(`https://api.telegram.org/bot${config.token}/${method}`, data, { timeout: 20000 });
  } catch (error) {
    const body = error.response?.data;
    if (body?.error_code === 429) throw new TelegramError('Telegram rate limit reached. Delivery will be retried.', 429, Math.min(3600, Math.max(1, Number(body.parameters?.retry_after) || 30)));
    if (body?.ok === false) throw new TelegramError(body.error_code === 401 ? 'Telegram rejected the bot token.' : 'Telegram rejected the request. Check bot access to the chat.', 502);
    // Telegram might have accepted a message before a connection timed out. Do not resend it automatically.
    throw new TelegramError('Telegram delivery could not be confirmed. Check the chat before sending again.', 502, null, true);
  }
  if (!response.data?.ok) {
    if (response.data?.error_code === 429) throw new TelegramError('Telegram rate limit reached. Delivery will be retried.', 429, Math.min(3600, Math.max(1, Number(response.data.parameters?.retry_after) || 30)));
    throw new TelegramError('Telegram rejected the request. Check the bot configuration and chat access.', 502);
  }
  return response.data.result;
}

function parseUpdate(update) {
  if (!update || !Number.isSafeInteger(update.update_id) || update.update_id < 0) throw new TelegramError('Invalid Telegram update.');
  const message = update.message;
  if (!message || message.from?.is_bot || !['private', 'group', 'supergroup'].includes(message.chat?.type)) return null;
  const chatId = String(message.chat.id);
  if (!Number.isSafeInteger(message.chat.id) || !/^-?\d{1,20}$/.test(chatId) || !Number.isSafeInteger(message.message_id) || message.message_id < 0) throw new TelegramError('Invalid Telegram message.');
  const senderName = [message.from?.first_name, message.from?.last_name].filter(value => typeof value === 'string').join(' ').slice(0, 200) || 'Telegram user';
  const attachment = ['photo', 'document', 'voice', 'video', 'audio', 'sticker', 'contact', 'location'].find(type => message[type]);
  const text = typeof message.text === 'string' ? message.text : `${attachment ? `[${attachment} attachment]` : '[Unsupported message]'}${typeof message.caption === 'string' ? `\n${message.caption}` : ''}`;
  return { eventKey: `update:${update.update_id}`, chatId, text: text.slice(0, 4096) || '[Empty message]', telegramMessageId: String(message.message_id), senderName,
    displayName: typeof message.chat.title === 'string' ? message.chat.title.slice(0, 200) : senderName,
    username: typeof message.chat.username === 'string' ? message.chat.username.slice(0, 100) : '', chatType: message.chat.type };
}

function isDuplicate(error) {
  return /unique|duplicate/i.test(`${error?.message || ''} ${error?.cause?.message || ''}`) || error?.details?.errors?.some(item => /unique/i.test(item.message));
}

async function ensureChat(strapi, chatId, metadata = {}) {
  let chat = await strapi.db.query(CHAT).findOne({ where: { chatId } });
  if (chat) return chat;
  try {
    chat = await strapi.documents(CHAT).create({ data: { chatId, displayName: metadata.displayName || `Chat ${chatId}`, username: metadata.username || '', chatType: metadata.chatType || (chatId.startsWith('-') ? 'supergroup' : 'private') } });
  } catch (error) {
    if (!isDuplicate(error)) throw error;
    chat = await strapi.db.query(CHAT).findOne({ where: { chatId } });
    if (!chat) throw error;
  }
  return chat;
}

async function updatePreview(strapi, chat, message, incoming = false) {
  const data = {};
  if (!chat.lastMessageAt || new Date(chat.lastMessageAt) <= new Date(message.createdAt)) {
    data.lastMessageAt = message.createdAt; data.preview = message.text.replace(/\s+/g, ' ').slice(0, 200);
  }
  if (incoming && (!chat.lastInboundAt || new Date(chat.lastInboundAt) <= new Date(message.createdAt))) data.lastInboundAt = message.createdAt;
  if (Object.keys(data).length) await strapi.db.query(CHAT).update({ where: { id: chat.id }, data });
}

async function ingestUpdate(strapi, update) {
  const parsed = parseUpdate(update);
  if (!parsed) return { ignored: true };
  const chat = await ensureChat(strapi, parsed.chatId, parsed);
  await strapi.db.query(CHAT).update({ where: { id: chat.id }, data: { displayName: parsed.displayName, username: parsed.username, chatType: parsed.chatType } });
  let message = await strapi.db.query(MESSAGE).findOne({ where: { eventKey: parsed.eventKey } });
  const duplicate = Boolean(message);
  if (!message) {
    try {
      message = await strapi.documents(MESSAGE).create({ data: { eventKey: parsed.eventKey, chatId: parsed.chatId, text: parsed.text, senderName: parsed.senderName, telegramMessageId: parsed.telegramMessageId, direction: 'incoming', deliveryStatus: 'received' } });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      message = await strapi.db.query(MESSAGE).findOne({ where: { eventKey: parsed.eventKey } });
      if (!message) throw error;
    }
  }
  await updatePreview(strapi, chat, message, true);
  return { received: true, duplicate };
}

async function queueMessage(strapi, data) {
  const existing = await strapi.db.query(MESSAGE).findOne({ where: { eventKey: data.eventKey } });
  if (existing) {
    if (existing.text !== data.text || existing.chatId !== data.chatId) throw new TelegramError('This submission ID was already used for a different message.', 409);
    return existing;
  }
  const chat = await ensureChat(strapi, data.chatId);
  let message;
  try { message = await strapi.documents(MESSAGE).create({ data: { ...data, direction: 'outgoing', deliveryStatus: 'pending', attempts: 0 } }); }
  catch (error) {
    if (!isDuplicate(error)) throw error;
    message = await strapi.db.query(MESSAGE).findOne({ where: { eventKey: data.eventKey } });
    if (!message) throw error;
    if (message.text !== data.text || message.chatId !== data.chatId) throw new TelegramError('This submission ID was already used for a different message.', 409);
  }
  await updatePreview(strapi, chat, message);
  return message;
}

function leadNotification(lead, config = configuration()) {
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Callback request';
  return [`New STARAVIA lead #${lead.clientId}`, `Client: ${name}`, `Phone: ${lead.phone}`, ...(lead.email ? [`Email: ${lead.email}`] : []), `Source: ${lead.source}`, ...(lead.departureAirport && lead.arrivalAirport ? [`Route: ${lead.departureAirport} → ${lead.arrivalAirport}`] : []), ...(lead.departureDate ? [`Departure: ${lead.departureDate}`] : []), ...(lead.returnDate ? [`Return: ${lead.returnDate}`] : []), ...(lead.passengers ? [`Passengers: ${lead.passengers}`] : []), ...(lead.cabin ? [`Cabin: ${lead.cabin}`] : []), ...(config.publicUrl ? [`Open lead: ${config.publicUrl}/admin/client=${lead.clientId}`] : [])].join('\n').slice(0, 4096);
}

async function enqueueLeadNotification(strapi, lead) {
  const config = configuration();
  if (!config.token || !config.target) return null;
  return queueMessage(strapi, { eventKey: `lead:${lead.documentId}`, chatId: config.target, text: leadNotification(lead, config), clientId: lead.clientId, senderName: 'STARAVIA lead notification' });
}

async function drainOutbox(strapi, options = {}) {
  const config = options.config || configuration();
  if (!config.token) return;
  // A stale in-flight request has an uncertain outcome; never silently duplicate it after a restart.
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  await strapi.db.query(MESSAGE).updateMany({ where: { deliveryStatus: 'sending', updatedAt: { $lt: cutoff } }, data: { deliveryStatus: 'unknown', lastError: 'Delivery interrupted. Check Telegram before sending again.' } });
  const messages = await strapi.db.query(MESSAGE).findMany({ where: { deliveryStatus: 'pending', $or: [{ nextAttemptAt: { $null: true } }, { nextAttemptAt: { $lte: new Date() } }] }, orderBy: { id: 'asc' }, limit: 5 });
  const table = strapi.db.metadata.get(MESSAGE).tableName;
  for (const message of messages) {
    // Claim using a single conditional SQL update so multiple Strapi workers cannot send the same row.
    const claimed = await strapi.db.connection(table).where({ id: message.id, delivery_status: 'pending' }).update({ delivery_status: 'sending', attempts: message.attempts + 1, updated_at: new Date() });
    if (!claimed) continue;
    let acknowledged = false;
    try {
      const result = await callTelegram('sendMessage', { chat_id: message.chatId, text: message.text, link_preview_options: { is_disabled: true }, ...(message.clientId && config.publicUrl ? { reply_markup: { inline_keyboard: [[{ text: `Open lead #${message.clientId}`, url: `${config.publicUrl}/admin/client=${message.clientId}` }]] } } : {}) }, { ...options, config });
      if (!Number.isSafeInteger(result?.message_id)) throw new TelegramError('Telegram delivery could not be confirmed. Check the chat before sending again.', 502, null, true);
      acknowledged = true;
      await strapi.db.query(MESSAGE).update({ where: { id: message.id }, data: { deliveryStatus: 'sent', telegramMessageId: String(result.message_id), lastError: null, nextAttemptAt: null } });
    } catch (error) {
      const retry = !acknowledged && error instanceof TelegramError && error.retryAfter && message.attempts < 4;
      await strapi.db.query(MESSAGE).update({ where: { id: message.id }, data: { deliveryStatus: retry ? 'pending' : acknowledged || error?.ambiguous || !(error instanceof TelegramError) ? 'unknown' : 'failed', nextAttemptAt: retry ? new Date(Date.now() + error.retryAfter * 1000) : null, lastError: acknowledged ? 'Telegram accepted the message, but its delivery record could not be saved. Check the chat before retrying.' : error instanceof TelegramError ? error.message : 'Delivery failed. Check Telegram before sending again.' } });
    }
  }
}

function startOutbox(strapi) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await drainOutbox(strapi); } catch { strapi.log.error('Telegram outbox processing failed.'); } finally { running = false; }
  };
  const timer = setInterval(tick, 3000); timer.unref();
  tick();
  return () => clearInterval(timer);
}

module.exports = { CHAT, MESSAGE, TelegramError, configuration, verifyWebhookSecret, callTelegram, parseUpdate, ingestUpdate, queueMessage, leadNotification, enqueueLeadNotification, drainOutbox, startOutbox };
