const BaseRepository = require('./base.repository');
const { Account, Payment, FinancialMovement } = require('../models');

class AccountRepository extends BaseRepository {
  constructor() {
    super(Account);
  }

  async incrementBalance(id, amount, t) {
    return this.model.increment('balance', { by: amount, where: { id }, transaction: t });
  }

  async createPayment(paymentData, t) {
    return Payment.create(paymentData, { transaction: t });
  }

  async createMovement(movementData, t) {
    return FinancialMovement.create(movementData, { transaction: t });
  }
}

module.exports = new AccountRepository();
