'use strict';
const { randomInt } = require('node:crypto');
module.exports = {
  beforeCreate(event) {
    if (!event.params.data.clientId) event.params.data.clientId = String(randomInt(100000, 1000000));
  },
  beforeUpdate(event) {
    // A lead keeps the same client reference when agents update its status or notes.
    delete event.params.data.clientId;
  },
};
