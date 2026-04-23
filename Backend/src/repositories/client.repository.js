const BaseRepository = require('./base.repository');
const db = require('../models');

class ClientRepository extends BaseRepository {
  constructor() {
    super(db.Client);
  }

  async findByIdWithRelations(id) {
    return this.model.findByPk(id, {
      include: ['sales', 'quotes']
    });
  }

  async findAllDesc() {
    return this.model.findAll({
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = new ClientRepository();
