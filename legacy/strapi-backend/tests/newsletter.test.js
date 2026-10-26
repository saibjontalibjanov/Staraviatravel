'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../src/api/newsletter-subscriber/controllers/newsletter-subscriber');
const context = data => ({ request: { body: { data } }, badRequest(message) { this.status = 400; this.body = { error: message }; }, internalServerError(message) { this.status = 500; this.body = { error: message }; } });

test('newsletter validates before touching the database', async () => {
  const previous = global.strapi;
  global.strapi = { db: { query: () => assert.fail('Invalid input must not query the database') } };
  try {
    for (const input of [undefined, {}, { email: 'invalid' }, { email: 'user@example.test', language: 'unknown' }, { email: 'x'.repeat(255)+'@example.test' }]) {
      const ctx = context(input); await controller.subscribe(ctx); assert.equal(ctx.status, 400);
    }
  } finally { global.strapi = previous; }
});

test('subscriber writes normalize email and omit untrusted fields', async () => {
  const previous = global.strapi; let saved;
  global.strapi = { db: { query: () => ({ findOne: async () => null }) }, documents: () => ({ create: async ({ data }) => { saved = data; return data; } }) };
  try {
    const ctx = context({ email: '  Client@Example.test  ', language: 'ru', isAdmin: true }); await controller.subscribe(ctx);
    assert.deepEqual(saved, { email: 'client@example.test', language: 'ru' }); assert.deepEqual(ctx.body, { subscribed: true });
  } finally { global.strapi = previous; }
});

test('a duplicate subscription returns success without adding another record or revealing existing data', async () => {
  const previous = global.strapi;
  global.strapi = { db: { query: () => ({ findOne: async () => ({ email: 'client@example.test', id: 42 }) }) }, documents: () => ({ create: () => assert.fail('Must not create a duplicate') }) };
  try { const ctx = context({ email: 'client@example.test' }); await controller.subscribe(ctx); assert.deepEqual(ctx.body, { subscribed: true }); }
  finally { global.strapi = previous; }
});

test('database failure cannot produce a fake subscribed response', async () => {
  const previous = global.strapi;
  global.strapi = { db: { query: () => ({ findOne: async () => null }) }, documents: () => ({ create: async () => { throw new Error('Database unavailable'); } }) };
  try { const ctx = context({ email: 'client@example.test' }); await controller.subscribe(ctx); assert.equal(ctx.status, 500); assert.equal(ctx.body.subscribed, undefined); }
  finally { global.strapi = previous; }
});
