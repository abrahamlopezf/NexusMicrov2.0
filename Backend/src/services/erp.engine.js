const productionService = require('./ProductionService');

/**
 * ERP ENGINE
 * Orchestrates automatic processes after key business events
 */

/**
 * Triggered after a sale is created
 */
const handleSaleCreated = async (saleId) => {
    try {
        console.log("⚙️ ERP ENGINE → processing sale:", saleId);

        // 1️⃣ Create production order automatically
        const workOrder = await productionService.createWorkOrderFromSale(saleId);

        console.log("✅ WorkOrder created:", workOrder.id);

        return workOrder;
    } catch (error) {
        console.error("ERP ENGINE ERROR:", error.message);
        throw error;
    }
};

module.exports = {
    handleSaleCreated
};
