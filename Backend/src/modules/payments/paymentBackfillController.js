const PaymentBackfillService = require('./PaymentBackfillService');

const backfillLegacyPayments = async (req, res, next) => {
    try {
        const dryRun = req.query.dryRun !== 'false';

        const result = await PaymentBackfillService.backfillLegacyPayments({
            dryRun,
            createdBy: req.user?.id || null
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    backfillLegacyPayments
};