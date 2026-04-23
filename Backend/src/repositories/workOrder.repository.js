const BaseRepository = require('./base.repository');
const { WorkOrder } = require('../models');

class WorkOrderRepository extends BaseRepository {
  constructor() {
    super(WorkOrder);
  }
}

module.exports = new WorkOrderRepository();
