const ProductionQueueService = require('./ProductionQueueService');

class ProductionQueueController {

    static async getQueue(req, res) {
        try {
            const queue = await ProductionQueueService.getQueue();

            return res.json({
                success: true,
                count: queue.length,
                data: queue
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ProductionQueueController;