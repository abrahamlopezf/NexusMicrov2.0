const BaseRepository = require('./base.repository');
const { InventoryMovement } = require('../models');

class InventoryMovementRepository extends BaseRepository {
  constructor() {
    super(InventoryMovement);
  }
}

module.exports = new InventoryMovementRepository();
