const SalePosSummaryService = require('./SalePosSummaryService');

const getPosSummary = async (req, res, next) => {
    try {
        const result = await SalePosSummaryService.getPosSummary(req.params.saleId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPosSummary
};