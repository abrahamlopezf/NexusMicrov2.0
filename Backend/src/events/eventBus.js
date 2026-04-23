const { EventEmitter } = require('events');
const logger = require('../utils/logger'); // Correct path for Winston proxy

class ERPEventBus extends EventEmitter {
    constructor() {
        super();
        // Prevent MaxListenersExceeded Warning for heavy ERP operations
        this.setMaxListeners(50);
    }

    /**
     * Emits an event to the bus.
     * @param {string} eventName - Name of the event
     * @param {object} payload - Data passed to handlers
     */
    emitEvent(eventName, payload) {
        logger.info(`[EVENT EMITTED] ${eventName}`);
        
        // Use setImmediate to ensure event handlers do not block the current synchronous execution flow
        // allowing the main API to return responses faster
        setImmediate(() => {
            try {
                this.emit(eventName, payload);
            } catch (error) {
                logger.error(`[EVENT ERROR] Failed to emit ${eventName}`, { error: error.message });
            }
        });
    }

    /**
     * Subscribes a handler to a specific event.
     * Ensure handlers are wrapped defensively.
     * @param {string} eventName 
     * @param {function} handler 
     */
    subscribe(eventName, handler) {
        this.on(eventName, async (payload) => {
            try {
                // Execute handler asynchronously
                await handler(payload);
            } catch (error) {
                logger.error(`[HANDLER ERROR] Exception in handler for ${eventName}`, { error: error.message });
                // In a true robust system, we would push failed payloads to a Dead Letter Queue (DLQ) here
            }
        });
        logger.info(`[EVENT SUBSCRIBED] Handler registered for ${eventName}`);
    }
}

// Singleton Pattern
const eventBus = new ERPEventBus();

// Automate Rule Processing: Hook all event broadcasts to the Rules Engine
const RulesEngine = require('../automation/rules.engine');
eventBus.on('newListener', (event) => {
    // We dynamically intercept standard events so we don't need a wildcard
});
// A better way is overriding emitEvent:
const originalEmit = eventBus.emitEvent.bind(eventBus);
eventBus.emitEvent = (eventName, payload) => {
    // 1) Process automation rules async
    RulesEngine.evaluateEvent(eventName, payload).catch(e => {
        logger.error(`RulesEngine failed for event: ${eventName}`, { error: e.message });
    });
    // 2) Trigger standard subscribed handlers
    originalEmit(eventName, payload);
};

// Automatically Register Handlers
const EVENTS = require('./events');
const saleCreatedHandler = require('./handlers/saleCreated.handler');
const workOrderCreatedHandler = require('./handlers/workOrderCreated.handler');

eventBus.subscribe(EVENTS.SALE_CREATED, saleCreatedHandler);
eventBus.subscribe(EVENTS.WORK_ORDER_CREATED, workOrderCreatedHandler);

module.exports = eventBus;
