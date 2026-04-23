const BaseRepository = require('./base.repository');
const { QuoteItem } = require('../models');

class QuoteItemRepository extends BaseRepository {
  constructor() {
    super(QuoteItem);
  }

  async deleteByQuoteId(quoteId, options = {}) {
    return this.model.destroy({ where: { quote_id: quoteId }, ...options });
  }
}

module.exports = new QuoteItemRepository();
