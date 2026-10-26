'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { configuration, verifyWebhookSecret, parseUpdate, TelegramError, callTelegram, leadNotification, drainOutbox, MESSAGE } = require('../src/services/telegram');
const config = { token: 'local-fixture-token', target: '-10012345', secret: 'fixture_secret_123456789', publicUrl: 'https://strapi.example.test' };
const update = { update_id: 1, message: { message_id: 20, chat: { id: 123456, type: 'private' }, from: { first_name: 'Test', last_name: 'Client' }, text: 'Hello' } };

test('configuration requires numeric destination, strong webhook secret and public HTTPS URL', () => {
  assert.deepEqual(configuration({ TELEGRAM_BOT_TOKEN: 'token', TELEGRAM_LEADS_CHAT_ID: '-1001', TELEGRAM_WEBHOOK_SECRET: 'a'.repeat(32), PUBLIC_STRAPI_URL: 'https://api.example.test/' }), { token: 'token', target: '-1001', secret: 'a'.repeat(32), publicUrl: 'https://api.example.test' });
  assert.equal(configuration({ TELEGRAM_LEADS_CHAT_ID: '@someone', TELEGRAM_WEBHOOK_SECRET: 'short', PUBLIC_STRAPI_URL: 'http://localhost' }).publicUrl, '');
  assert.equal(configuration({ PUBLIC_STRAPI_URL: 'https://user:password@example.test' }).publicUrl, '');
});

test('webhook authentication rejects missing, mismatching and different-length secrets', () => {
  assert.equal(verifyWebhookSecret(config.secret, config.secret), true);
  for (const supplied of [undefined, '', 'invalid', config.secret+'x']) assert.equal(verifyWebhookSecret(supplied, config.secret), false);
  assert.equal(verifyWebhookSecret('', ''), false);
});

test('incoming updates use an idempotency key and retain chat identity', () => {
  const parsed = parseUpdate(update);
  assert.equal(parsed.eventKey, 'update:1'); assert.equal(parsed.chatId, '123456'); assert.equal(parsed.senderName, 'Test Client'); assert.equal(parsed.text, 'Hello');
});

test('ignores bot messages and unsupported update kinds; labels attachments without downloading files', () => {
  assert.equal(parseUpdate({ update_id: 2, callback_query: {} }), null);
  assert.equal(parseUpdate({ ...update, message: { ...update.message, from: { is_bot: true } } }), null);
  const parsed = parseUpdate({ ...update, message: { ...update.message, text: undefined, photo: [{ file_id: 'not-downloaded' }], caption: 'My itinerary' } });
  assert.equal(parsed.text, '[photo attachment]\nMy itinerary');
});

test('rejects malformed update IDs and unsafe numeric chat IDs', () => {
  for (const bad of [null, {}, { ...update, update_id: -1 }, { ...update, message: { ...update.message, chat: { id: Number.MAX_SAFE_INTEGER+1, type: 'private' } } }]) assert.throws(() => parseUpdate(bad), TelegramError);
});

test('Bot API wrapper never exposes tokens in transport failures', async () => {
  await assert.rejects(callTelegram('sendMessage', {}, { config, http: { post: async () => { throw new Error('http://bot'+config.token); } } }), error => error.ambiguous === true && !error.message.includes(config.token));
  await assert.rejects(callTelegram('sendMessage', {}, { config: { ...config, token: '' } }), error => error.status === 503);
});

test('Telegram rate limiting uses retry-after; rejected requests are not treated as sent', async () => {
  await assert.rejects(callTelegram('sendMessage', {}, { config, http: { post: async () => { throw { response: { data: { ok: false, error_code: 429, parameters: { retry_after: 12 } } } }; } } }), error => error.retryAfter === 12 && !error.ambiguous);
  await assert.rejects(callTelegram('sendMessage', {}, { config, http: { post: async () => ({ data: { ok: false, error_code: 403 } }) } }), error => error.status === 502);
});

test('new lead notification contains six-digit reference, contact details and protected admin link', () => {
  const text = leadNotification({ clientId: '123456', firstName: 'Test', phone: '+998901234567', source: 'booking', departureAirport: 'TAS', arrivalAirport: 'IST', passengers: 2 }, config);
  assert.match(text, /#123456/); assert.match(text, /TAS → IST/); assert.match(text, /https:\/\/strapi.example.test\/admin\/client=123456/); assert(text.length <= 4096);
});

function outboxFixture(claimed = 1) {
  const changes = [];
  const row = { id: 1, chatId: '123456', text: 'Hello', attempts: 0, clientId: '123456' };
  const strapi = { db: { metadata: { get: () => ({ tableName: 'telegram_messages' }) }, connection: () => ({ where: () => ({ update: async () => claimed }) }), query: uid => {
    assert.equal(uid, MESSAGE);
    return { updateMany: async () => {}, findMany: async () => [row], update: async args => { changes.push(args.data); } };
  } } };
  return { strapi, changes };
}

test('outbox marks sent only after Telegram acknowledges a message ID', async () => {
  const { strapi, changes } = outboxFixture();
  await drainOutbox(strapi, { config, http: { post: async (url, data) => { assert.equal(data.chat_id, '123456'); assert.equal(data.parse_mode, undefined); assert.match(data.reply_markup.inline_keyboard[0][0].url, /client=123456$/); return { data: { ok: true, result: { message_id: 10 } } }; } } });
  assert.equal(changes[0].deliveryStatus, 'sent'); assert.equal(changes[0].telegramMessageId, '10');
});

test('competing workers cannot send a row they did not claim', async () => {
  const { strapi } = outboxFixture(0);
  await drainOutbox(strapi, { config, http: { post: () => assert.fail('Must not send a row claimed by another worker') } });
});

test('ambiguous timeouts are not automatically resent; rate-limited deliveries remain queued', async () => {
  const first = outboxFixture();
  await drainOutbox(first.strapi, { config, http: { post: async () => { throw new Error('timeout'); } } });
  assert.equal(first.changes[0].deliveryStatus, 'unknown');
  const second = outboxFixture();
  await drainOutbox(second.strapi, { config, http: { post: async () => ({ data: { ok: false, error_code: 429, parameters: { retry_after: 1 } } }) } });
  assert.equal(second.changes[0].deliveryStatus, 'pending'); assert(second.changes[0].nextAttemptAt instanceof Date);
});

test('an acknowledged send whose database update fails becomes uncertain, not safely retryable', async () => {
  const { strapi, changes } = outboxFixture();
  const originalQuery = strapi.db.query;
  strapi.db.query = uid => {
    const query = originalQuery(uid);
    return { ...query, update: async args => { if (args.data.deliveryStatus === 'sent') throw new Error('Database temporarily unavailable'); return query.update(args); } };
  };
  await drainOutbox(strapi, { config, http: { post: async () => ({ data: { ok: true, result: { message_id: 123 } } }) } });
  assert.equal(changes[0].deliveryStatus, 'unknown');
});
