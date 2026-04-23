const WorkOrderService = require("../services/WorkOrderService");

const createWorkOrder = async (req, res, next) => {
    try {
        const result = await WorkOrderService.createWorkOrder(req.body);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getWorkOrders = async (req, res, next) => {
    try {
        const result = await WorkOrderService.getWorkOrders(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getWorkOrderById = async (req, res, next) => {
    try {
        const result = await WorkOrderService.getWorkOrderById(req.params.id);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateWorkOrderStatus = async (req, res, next) => {
    try {
        const result = await WorkOrderService.updateWorkOrderStatus(req.params.id, req.body.status);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const assignWorkOrder = async (req, res, next) => {
    try {
        const result = await WorkOrderService.assignWorkOrder(req.params.id, req.body.employeeId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createWorkOrder,
    getWorkOrders,
    getWorkOrderById,
    updateWorkOrderStatus,
    assignWorkOrder
};
