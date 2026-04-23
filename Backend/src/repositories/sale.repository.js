const BaseRepository = require('./base.repository');
const db = require('../models');

class SaleRepository extends BaseRepository {
  constructor() {
    super(db.Sale);
  }

  async findByIdWithAssociations(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        { model: db.Client, as: 'client' },
        { model: db.SaleItem, as: 'items', include: [{ model: db.Product, as: 'product' }] },
        { model: db.Payment, as: 'payments' },
        { model: db.WorkOrder, as: 'work_order' }
      ],
      ...options
    });
  }

  async findAllWithClientDesc(page = 1, limit = 20, options = {}) {
    const offset = (page - 1) * limit;
    return this.model.findAndCountAll({
      include: [{ model: db.Client, as: 'client', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      ...options
    });
  }

  async sumItemsTotal(saleId, options = {}) {
    return db.SaleItem.sum('total', {
      where: { sale_id: saleId },
      ...options
    });
  }

  async sumPaymentsAmount(saleId, options = {}) {
    return db.Payment.sum('amount', {
      where: { sale_id: saleId },
      ...options
    });
  }

  async bulkCreateItems(items, options = {}) {
    return db.SaleItem.bulkCreate(items, options);
  }

  async createItem(item, options = {}) {
    return db.SaleItem.create(item, options);
  }

  // Related models that might not have their own repository yet
  async createPayment(payment, options = {}) {
    return db.Payment.create(payment, options);
  }

  async createFinancialMovement(movement, options = {}) {
    return db.FinancialMovement.create(movement, options);
  }

  async findAccountById(id, options = {}) {
    return db.Account.findByPk(id, options);
  }
}

module.exports = new SaleRepository();
