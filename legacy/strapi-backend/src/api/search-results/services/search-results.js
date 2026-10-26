'use strict';

/**
 * search-results service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::search-results.search-results');
