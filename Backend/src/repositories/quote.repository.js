const BaseRepository = require('./base.repository');
const { Quote, QuoteItem } = require('../models');

class QuoteRepository extends BaseRepository {
  constructor() {
    super(Quote);
  }

  async count(options = {}) {
    return this.model.count(options);
  }

  async getQuoteWithItems(id, options = {}) {
    return this.model.findByPk(id, {
      include: [{ model: QuoteItem, as: 'items', include: ['product'] }],
      ...options
    });
  }
}

module.exports = new QuoteRepository();
