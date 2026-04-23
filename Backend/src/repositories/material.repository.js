const BaseRepository = require('./base.repository');
const { Material } = require('../models');

class MaterialRepository extends BaseRepository {
  constructor() {
    super(Material);
  }

  /**
   * Incrementa el stock atómicamente a nivel de base de datos
   */
  async incrementStock(id, qty, transaction) {
    return this.model.increment('current_stock', {
      by: qty,
      where: { id },
      transaction
    });
  }

  /**
   * Decrementa el stock atómicamente asegurando que no baje de cero
   */
  async decrementStockSafely(id, qty, sequelize, Op, transaction) {
    const [updatedRows] = await this.model.update(
      { current_stock: sequelize.literal(`current_stock - ${qty}`) },
      { 
        where: { 
          id, 
          current_stock: { [Op.gte]: qty } 
        }, 
        transaction 
      }
    );
    return updatedRows > 0;
  }
}

module.exports = new MaterialRepository();
