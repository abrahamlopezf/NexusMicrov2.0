const PaymentService = require('./PaymentService');

const registerPayment = async (req, res, next) => {
    try {
        const result = await PaymentService.registerPayment({
            ...req.body,
            created_by: req.user?.id || null
        });

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

const cancelPayment = async (req, res, next) => {
    try {
        const result = await PaymentService.cancelPayment(
            req.params.paymentId,
            req.body.reason,
            req.user?.id || null,
            req.body.manager_authorization || null
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const liquidateSale = async (req, res, next) => {
    try {
        const result = await PaymentService.liquidateSale(
            req.params.saleId,
            req.body,
            req.user?.id || null
        );

        res.status(201).json({
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
    getPaymentBySale,
    cancelPayment,
    liquidateSale
};