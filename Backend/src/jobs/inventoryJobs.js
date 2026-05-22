const { InventoryReservation, sequelize } = require('../models');
const { Op } = require('sequelize');
const InventoryService = require('../modules/inventory/InventoryService');
const logger = require('../utils/logger');

const startExpirationJob = () => {
    // Run every 10 minutes
    setInterval(async () => {
        try {
            const expiredReservations = await InventoryReservation.findAll({
                where: {
                    status: 'RESERVED',
                    expires_at: {
                        [Op.lt]: new Date()
                    }
                }
            });

            if (expiredReservations.length > 0) {
                logger.info(`Found ${expiredReservations.length} expired reservations to release.`);
                for (const res of expiredReservations) {
                    await sequelize.transaction(async (t) => {
                        const context = { operation_id: res.operation_id, sale_id: res.sale_id };
                        // Release using the InventoryService
                        await InventoryService.releaseReservedStock(res.material_id, res.quantity, context, t);
                    });
                }
                logger.info(`Successfully released ${expiredReservations.length} expired reservations.`);
            }
        } catch (error) {
            logger.error(`Error in expiration job: ${error.message}`);
        }
    }, 10 * 60 * 1000); // 10 minutes
};

module.exports = { startExpirationJob };
