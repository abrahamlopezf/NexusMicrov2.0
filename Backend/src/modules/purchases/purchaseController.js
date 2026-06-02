const PurchaseService = require('./PurchaseService');

const createPurchaseOrder = async (req, res, next) => {
    try {
        const result = await PurchaseService.createPurchaseOrder(req.body, req.user.id);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPurchaseOrders = async (req, res, next) => {
    try {
        const result = await PurchaseService.getPurchaseOrders(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPurchaseOrderById = async (req, res, next) => {
    try {
        const result = await PurchaseService.getPurchaseOrderById(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const receivePurchaseOrder = async (req, res, next) => {
    try {
        const result = await PurchaseService.receivePurchaseOrder(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Orden de compra recibida e inventario actualizado'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    receivePurchaseOrder
};
