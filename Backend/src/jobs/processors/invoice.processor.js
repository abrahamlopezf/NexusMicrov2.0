const logger = require('../../observability/logger');

const processInvoice = async (job) => {
    logger.logInfo('invoice-processor', `Generating invoice for job ${job.id}`, job.payload);
    
    // Simulate async invoice generation
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // MOCK: In a real system you'd call InvoiceService here
            logger.logInfo('invoice-processor', `Successfully generated invoice for job ${job.id}`);
            resolve({ invoiceUrl: `/invoices/${job.id}.pdf` });
        }, 1500);
    });
};

module.exports = processInvoice;
