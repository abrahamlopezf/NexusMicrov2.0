/**
 * Automation Rules Registry
 * Maps an incoming system event string to a list of background job types to be enqueued.
 */

const EVENTS = require('../events/events');

const rulesRegistry = {
    [EVENTS.SALE_CREATED]: [
        'GENERATE_INVOICE',
        'UPDATE_ANALYTICS'
    ],
    [EVENTS.INVENTORY_UPDATED]: [
        // 'CREATE_PURCHASE_ORDER' // Example mapping that could trigger if stock is low
    ],
    // Add additional mappings here
    'INVENTORY_LOW': [
        'CREATE_PURCHASE_ORDER'
    ]
};

module.exports = rulesRegistry;
