'use strict';
module.exports = {
  routes: [{
    method: 'POST',
    path: '/leads',
    handler: 'lead.create',
    config: { auth: false, middlewares: ['global::lead-rate-limit'] },
  }],
};
