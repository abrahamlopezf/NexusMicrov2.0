const db = require('../models');

/**
 * Middleware to start a managed Sequelize transaction and attach it to the request object.
 * It will automatically commit on response finish (successful status codes) 
 * or rollback on error or close uncompleted.
 */
const transactionMiddleware = async (req, res, next) => {
    try {
        const transaction = await db.sequelize.transaction();
        req.transaction = transaction;

        // Hook into response finish to commit or rollback
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                if (!transaction.finished) {
                    await transaction.commit();
                }
            } else {
                if (!transaction.finished) {
                    await transaction.rollback();
                }
            }
        });

        // Ensure rollback if connection closes unexpectedly
        res.on('close', async () => {
            if (!transaction.finished) {
                await transaction.rollback();
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = transactionMiddleware;
