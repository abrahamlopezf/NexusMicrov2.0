const eventBus = require('../eventBus');
const EVENTS = require('../events');
const logger = require('../../middlewares/loggerMiddleware');

// We use dynamic imports/require at runtime inside handlers if needed to avoid Circular Dependencies 
// between the EventBus/Handlers and Services if Services also emit events.

/**
 * Handles workflow automation after a Sale is successfully created.
 * @param {Object} sale - The created sale metadata
 */
const handleSaleCreated = async (sale) => {
    logger.info(`⚙️ [WORKFLOW] Processing SALE_CREATED for Sale ID: ${sale.id}`);
    
    // Require services lazily to avoid circular module resolution conflicts
    const WorkOrderService = require('../../modules/workorders/WorkOrderService');
    // const ProductionService = require('../../services/Production.service');
    // const InventoryService = require('../../services/InventoryWrapper.service');

    try {
        // Step 1: Create Work Order automatically for the sale
        // This simulates a core ERP transaction
        logger.info(`⚙️ [WORKFLOW] Generating automatic WorkOrder for Sale ${sale.id}`);
        
        // Mocking the call since WorkOrderService and ProductionService are currently stubs
        // In reality, this would map the products sold to a new WO.
        const workOrderInput = {
            saleId: sale.id,
            status: 'PENDING',
            priority: 'NORMAL',
            description: `Auto-generated WO for Sale Context ${sale.id}`
        };

        const workOrder = await WorkOrderService.createWorkOrder(workOrderInput);
        
        // Step 2: Trigger downstream event chain
        if (workOrder && workOrder.id) {
            eventBus.emitEvent(EVENTS.WORK_ORDER_CREATED, workOrder);
        } else {
             logger.info(`⚙️ [WORKFLOW MOCK] Generated successful Mock WorkOrder for Sale ${sale.id}`);
             // If mock service returns {} without id, emit an arbitrary mock payload for testing flow
             eventBus.emitEvent(EVENTS.WORK_ORDER_CREATED, { id: 'MOCK_WO_ID', saleId: sale.id });
        }

        // Step 3: Reserve Materials via Inventory Service could also happen here
        // await InventoryService.adjustInventory({...});

    } catch (error) {
        logger.error(`[WORKFLOW ERROR] Failed processing SALE_CREATED handler`, error);
        throw error;
    }
};

module.exports = handleSaleCreated;
