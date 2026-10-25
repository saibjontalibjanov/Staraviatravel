'use strict';
const { publicCheckout, CheckoutError } = require('../../../services/lead-checkout');
module.exports = {
  async findByToken(ctx) {
    ctx.set('Cache-Control', 'no-store, private');
    ctx.set('Referrer-Policy', 'no-referrer');
    ctx.set('X-Robots-Tag', 'noindex, nofollow');
    try { ctx.body = await publicCheckout(strapi, ctx.params.token); }
    catch (error) {
      ctx.status = error instanceof CheckoutError ? error.status : 500;
      ctx.body = { error: { message: error instanceof CheckoutError ? error.message : 'Checkout unavailable. Please try again.' } };
    }
  },
};
