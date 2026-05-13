const { RESERVE_STOCK, RELEASE_STOCK, CONSUME_STOCK } = require('../jobs/inventory.jobs');
const InventoryService = require('../../services/InventoryService');
const { sequelize, StockAlert } = require('../../models');
const logger = require('../../utils/logger');

const handleReserveStock = async (data) => {
  logger.info(`[RESERVE_STOCK] Validating stock for materials`, data.materialsEstimate);
};

const handleReleaseStock = async (data) => {
  logger.info(`[RELEASE_STOCK] Releasing stock for material ${data.materialId}`);
};

const handleConsumeStock = async (data) => {
  const { realMaterialsUsed } = data;
  await sequelize.transaction(async (t) => {
    await InventoryService.deductProductionMaterials(realMaterialsUsed, t);
  });
};

const handleLowStockAlert = async (data) => {
  logger.warn({
    event: 'LOW_STOCK_ALERT',
    correlationId: data.correlationId || 'N/A',
    materialId: data.materialId,
    current_stock: data.current_stock,
    min_stock: data.min_stock
  });

  await sequelize.transaction(async (t) => {
    try {
      const [alert, created] = await StockAlert.findOrCreate({
        where: { material_id: data.materialId, resolved: false },
        defaults: {
          message: `Material ${data.materialName} has reached low stock. Current: ${data.current_stock}, Min: ${data.min_stock}`,
          level: 'LOW',
          current_stock: data.current_stock,
          min_stock: data.min_stock,
          correlation_id: data.correlationId || null,
          processed: false
        },
        transaction: t
      });

      if (!alert.processed) {
        alert.processed = true;
        alert.processed_at = new Date();
        await alert.save({ transaction: t });
        logger.info(`[LOW_STOCK_ALERT] Successfully processed commit marker for material ${data.materialId}`);
      }
    } catch (alertError) {
      if (alertError.name === 'SequelizeUniqueConstraintError') {
        logger.info(`[LOW_STOCK_ALERT] Unresolved alert already exists for material ${data.materialId}. Skipping duplicate.`);
      } else {
        throw alertError;
      }
    }
  });
};

module.exports = {
  handleReserveStock,
  handleReleaseStock,
  handleConsumeStock,
  handleLowStockAlert
};
