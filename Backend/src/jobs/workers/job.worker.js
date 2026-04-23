const db = require('../../models');
const logger = require('../../observability/logger');

// Import Processors
const processInvoice = require('../processors/invoice.processor');
const processEmail = require('../processors/email.processor');
const processAnalytics = require('../processors/analytics.processor');

// Processor Map
const PROCESSORS = {
    'GENERATE_INVOICE': processInvoice,
    'SEND_EMAIL': processEmail,
    'UPDATE_ANALYTICS': processAnalytics,
    'CREATE_PURCHASE_ORDER': async () => { logger.logInfo('worker', 'Mock purchase order creation'); }
};

class JobWorker {
    constructor() {
        this.isProcessing = false;
        this.pollInterval = 5000; // Poll every 5 seconds
        this.timer = null;
    }

    /**
     * Starts the background worker polling. 
     * In a production multi-node setup, this should run entirely on a separate process/container.
     */
    start() {
        logger.logInfo('job-worker', 'Background Job Worker started');
        this.poll();
    }

    async poll() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Find one pending job
            // Using a basic select. In purely robust setups, we would use FOR UPDATE SKIP LOCKED
            const job = await db.Job.findOne({
                where: { status: 'PENDING' },
                order: [['created_at', 'ASC']]
            });

            if (job) {
                await this.processJob(job);
                // Immediately check for next job if one was processed
                this.isProcessing = false;
                setImmediate(() => this.poll());
                return;
            }
        } catch (error) {
            logger.logError('job-worker', 'Error during job polling', { error: error.message });
        }

        this.isProcessing = false;
        // Schedule next poll
        this.timer = setTimeout(() => this.poll(), this.pollInterval);
    }

    async processJob(job) {
        logger.logInfo('job-worker', `Processing job: ${job.id} of type ${job.type}`);
        
        // Mark as processing
        job.status = 'PROCESSING';
        await job.save();

        const processor = PROCESSORS[job.type];

        if (!processor) {
            job.status = 'FAILED';
            job.error_log = `No processor registered for job type: ${job.type}`;
            job.processed_at = new Date();
            await job.save();
            logger.logError('job-worker', `Job failed - no processor`, { jobId: job.id, type: job.type });
            return;
        }

        try {
            // Execute the processor
            await processor(job);
            
            // Mark as completed
            job.status = 'COMPLETED';
            job.processed_at = new Date();
            await job.save();
            
            logger.logInfo('job-worker', `Completed job: ${job.id}`);
        } catch (error) {
            // Mark as failed
            job.status = 'FAILED';
            job.error_log = error.stack || error.message;
            job.processed_at = new Date();
            await job.save();
            
            logger.logError('job-worker', `Failed job: ${job.id}`, { error: error.message });
        }
    }
    
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        logger.logInfo('job-worker', 'Background Job Worker stopped');
    }
}

// Singleton for local execution
const worker = new JobWorker();

module.exports = worker;
