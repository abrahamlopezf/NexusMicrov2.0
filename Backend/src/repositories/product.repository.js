const BaseRepository = require('./base.repository');
const db = require('../models');

class ProductRepository extends BaseRepository {
  constructor() {
    super(db.Product);
  }

  async findByIdWithMaterials(id, options = {}) {
    return this.model.findByPk(id, {
      include: [{
        model: db.ProductMaterial,
        as: 'materials',
        include: [{ model: db.Material, as: 'material' }]
      }],
      ...options
    });
  }

  async findAllDesc(options = {}) {
    return this.model.findAll({
      order: [['created_at', 'DESC']],
      ...options
    });
  }

  async replaceMaterials(productId, bomItems, options = {}) {
    await db.ProductMaterial.destroy({ where: { product_id: productId }, ...options });
    if (bomItems && bomItems.length > 0) {
      await db.ProductMaterial.bulkCreate(bomItems, options);
    }
  }

  async deleteMaterials(productId, options = {}) {
    await db.ProductMaterial.destroy({ where: { product_id: productId }, ...options });
  }

  async addMaterials(bomItems, options = {}) {
    if (bomItems && bomItems.length > 0) {
        await db.ProductMaterial.bulkCreate(bomItems, options);
    }
  }
}

module.exports = new ProductRepository();
