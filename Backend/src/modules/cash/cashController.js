const CashService = require('./CashService');

const openSession = async (req, res, next) => {
    try {
        const result = await CashService.openSession(
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

const getCurrentSession = async (req, res, next) => {
    try {
        const result = await CashService.getCurrentSession(req.user?.id || null);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const closeSession = async (req, res, next) => {
    try {
        const result = await CashService.closeSession(
            req.body,
            req.user?.id || null
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createManualMovement = async (req, res, next) => {
    try {
        const result = await CashService.createManualMovement(
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

const cancelManualMovement = async (req, res, next) => {
    try {
        const result = await CashService.cancelManualMovement(
            req.params.movementId,
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

module.exports = {
    openSession,
    getCurrentSession,
    closeSession,
    createManualMovement,
    cancelManualMovement
};