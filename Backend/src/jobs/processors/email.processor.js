const logger = require('../../observability/logger');

const processEmail = async (job) => {
    logger.logInfo('email-processor', `Sending email for job ${job.id}`, job.payload);
    
    // Simulate async email sending
    return new Promise((resolve) => {
        setTimeout(() => {
            logger.logInfo('email-processor', `Successfully sent email for job ${job.id}`);
            resolve({ delivered: true });
        }, 1000);
    });
};

module.exports = processEmail;
