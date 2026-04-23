const db = require('../models');

class TransactionManager {
  static async startTransaction() {
    return db.sequelize.transaction();
  }
}

module.exports = TransactionManager;
