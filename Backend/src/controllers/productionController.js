const ProductionService = require("../services/ProductionService");

const startProduction = async (req, res, next) => {
    try {
        const result = await ProductionService.startProduction(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const completeProduction = async (req, res, next) => {
    try {
        const result = await ProductionService.completeProduction(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getProductionStatus = async (req, res, next) => {
    try {
        const result = await ProductionService.getProductionStatus(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    startProduction,
    completeProduction,
    getProductionStatus
};