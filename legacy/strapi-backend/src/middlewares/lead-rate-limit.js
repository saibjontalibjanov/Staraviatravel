'use strict';
module.exports = () => {
  const attempts = new Map();
  const windowMs = 10 * 60 * 1000;
  return async (ctx, next) => {
    const now = Date.now();
    for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
    const key = ctx.ip;
    const current = attempts.get(key) || { count: 0, expires: now + windowMs };
    if (current.count >= 20 || (!attempts.has(key) && attempts.size >= 10000)) {
      ctx.set('Retry-After', String(Math.max(1, Math.ceil((current.expires - now) / 1000))));
      ctx.status = 429;
      ctx.body = { error: { message: 'Too many applications. Please try again later.' } };
      return;
    }
    current.count++;
    attempts.set(key, current);
    await next();
  };
};
