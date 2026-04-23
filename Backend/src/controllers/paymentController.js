const PaymentService = require("../services/PaymentService");

const registerPayment = async (req, res, next) => {
    try {
        const result = await PaymentService.registerPayment(req.body);
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPayments = async (req, res, next) => {
    try {
        const result = await PaymentService.getPayments(req.query);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getPaymentBySale = async (req, res, next) => {
    try {
        const result = await PaymentService.getPaymentBySale(req.params.saleId);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerPayment,
    getPayments,
    getPaymentBySale
};
