const { Client, Sale } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class LoyaltyService {
    /**
     * Updates client points after a successful sale
     * 1 item = 1 point
     */
    static async processSaleLoyalty(clientId, saleId, itemsCount, transaction) {
        const client = await Client.findByPk(clientId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!client) throw new AppError('Client not found for loyalty processing', 404);

        const oldPoints = client.loyalty_points || 0;
        const newPoints = oldPoints + itemsCount;
        
        // Update lifetime stats
        const totalPurchases = (client.total_purchases || 0) + itemsCount;

        await client.update({
            loyalty_points: newPoints,
            total_purchases: totalPurchases,
            last_purchase_date: new Date()
        }, { transaction });

        logger.info(`[LOYALTY] Client ${clientId} updated: ${oldPoints} -> ${newPoints} points. Total purchases: ${totalPurchases}`);
        
        return {
            pointsAdded: itemsCount,
            currentPoints: newPoints,
            isEligibleForReward: newPoints >= 10
        };
    }

    /**
     * Checks if a client is eligible for the 10th item free reward
     */
    static async checkRewardEligibility(clientId) {
        const client = await Client.findByPk(clientId);
        if (!client) return false;
        return (client.loyalty_points || 0) >= 9; // If they have 9, the 10th is free
    }

    /**
     * Consumes points when a reward is claimed
     */
    static async redeemReward(clientId, transaction) {
        const client = await Client.findByPk(clientId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!client) throw new AppError('Client not found', 404);

        if (client.loyalty_points < 9) {
            throw new AppError('Insufficient loyalty points for reward', 400);
        }

        const newPoints = Math.max(0, client.loyalty_points - 9);
        await client.update({ loyalty_points: newPoints }, { transaction });

        logger.info(`[LOYALTY] Reward redeemed for client ${clientId}. New points: ${newPoints}`);
    }
}

module.exports = LoyaltyService;
