/**
 * Failure Handler — Dead-letter logging for BullMQ workers
 *
 * Attaches 'failed' event listener to each worker.
 * Logs structured failure data to both Winston and a dedicated queue-errors.log file.
 * Never throws — must not crash the worker process.
 */
const path   = require('path');
const fs     = require('fs');
const logger = require('../utils/logger');

const LOG_DIR  = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'queue-errors.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Writes a structured entry to queue-errors.log.
 */
function writeToErrorLog(entry) {
    try {
        const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
        fs.appendFileSync(LOG_FILE, line, 'utf8');
    } catch (fsErr) {
        logger.error(`[failureHandler] Could not write to queue-errors.log: ${fsErr.message}`);
    }
}

/**
 * Attaches the 'failed' listener to a BullMQ Worker instance.
 * @param {import('bullmq').Worker} worker
 */
function attachFailureHandler(worker) {
    worker.on('failed', (job, err) => {
        const entry = {
            queue:     worker.name,
            jobId:     job ? job.id : 'unknown',
            jobType:   job ? job.name : 'unknown',
            attempt:   job ? job.attemptsMade : 0,
            payload:   job ? job.data : null,
            error:     err.message,
            stack:     err.stack
        };

        logger.error(`💀 [deadLetter] ${entry.queue}:${entry.jobType} jobId=${entry.jobId} attempt=${entry.attempt} — ${err.message}`, {
            payload: entry.payload
        });

        writeToErrorLog(entry);
    });

    worker.on('error', (err) => {
        logger.error(`❌ [worker:${worker.name}] Worker-level error: ${err.message}`, { stack: err.stack });
    });
}

module.exports = { attachFailureHandler };
