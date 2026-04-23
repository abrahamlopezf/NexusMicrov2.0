const eventBus = require('../eventBus');
const EVENTS = require('../events');
const logger = require('../../middlewares/loggerMiddleware');

/**
 * Handles workflow automation after a Work Order is successfully generated.
 * @param {Object} workOrder - The created Work Order
 */
const handleWorkOrderCreated = async (workOrder) => {
    logger.info(`⚙️ [WORKFLOW] Processing WORK_ORDER_CREATED for WO ID: ${workOrder.id}`);

    const TaskService = require('../../services/Task.service');

    try {
        logger.info(`⚙️ [WORKFLOW] Generating Production Tasks for WO ${workOrder.id}`);
        
        // Step 1: Create associated production tasks (Mocked)
        const taskPayload = {
            workOrderId: workOrder.id,
            name: 'Initial Machinery Setup',
            status: 'PENDING'
        };

        const task = await TaskService.createTask(taskPayload);

        // Emit final event
        if (task && task.id) {
            eventBus.emitEvent(EVENTS.PRODUCTION_TASK_CREATED, task);
        } else {
            logger.info(`⚙️ [WORKFLOW MOCK] Generated successful Mock Task for WO ${workOrder.id}`);
            eventBus.emitEvent(EVENTS.PRODUCTION_TASK_CREATED, { id: 'MOCK_TASK_ID', workOrderId: workOrder.id });
        }

    } catch (error) {
         logger.error(`[WORKFLOW ERROR] Failed processing WORK_ORDER_CREATED handler`, error);
         throw error;
    }
};

module.exports = handleWorkOrderCreated;
