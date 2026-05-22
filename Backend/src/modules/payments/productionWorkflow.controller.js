const asyncHandler = require('../../middlewares/asyncHandlerMiddleware');

const ProductionWorkflowService = require('./ProductionWorkflowService');
const GarmentDeliveryService = require('../sales/GarmentDeliveryService');

exports.startProduction = asyncHandler(async (req, res) => {

    const result = await ProductionWorkflowService.startProduction(
        req.params.saleItemId,
        req.user?.id || null
    );

    res.status(200).json({
        success: true,
        message: 'Production started',
        data: result
    });
});

exports.markReady = asyncHandler(async (req, res) => {

    const result = await ProductionWorkflowService.markReady(
        req.params.saleItemId,
        req.user?.id || null
    );

    res.status(200).json({
        success: true,
        message: 'Garment marked as READY',
        data: result
    });
});

exports.deliverGarment = asyncHandler(async (req, res) => {

    const result = await GarmentDeliveryService.deliverGarment(
        req.params.saleItemId,
        req.user?.id || null
    );

    res.status(200).json({
        success: true,
        message: 'Garment delivered',
        data: result
    });
});

exports.cancelProduction = asyncHandler(async (req, res) => {

    const result = await ProductionWorkflowService.cancelProduction(
        req.params.saleItemId,
        req.body.reason,
        req.user?.id || null
    );

    res.status(200).json({
        success: true,
        message: 'Production cancelled',
        data: result
    });
});