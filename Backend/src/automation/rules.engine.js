const rulesRegistry = require('./rules.registry');
const JobQueue = require('../jobs/queues/job.queue');
const logger = require('../observability/logger');

/**
 * Rules Engine
 * Inspects incoming events and automatically enqueues the mapped jobs asynchronously.
 */
class RulesEngine {
    
    /**
     * Evaluates an event against the Rules Registry.
     * @param {string} eventName 
     * @param {Object} payload 
     */
    static async evaluateEvent(eventName, payload) {
        const rules = rulesRegistry[eventName];
        
        if (!rules || rules.length === 0) {
            logger.logDebug('rules-engine', `No automation rules defined for event: ${eventName}`);
            return;
        }

        logger.logInfo('rules-engine', `Triggering ${rules.length} automation jobs for event: ${eventName}`);

        for (const jobType of rules) {
            try {
                // Determine what data from the payload the job actually needs, or just pass the whole payload
                await JobQueue.enqueue(jobType, payload);
            } catch (error) {
                logger.logError('rules-engine', `Failed to enqueue job: ${jobType} from event: ${eventName}`, { error: error.message });
            }
        }
    }
}

module.exports = RulesEngine;
