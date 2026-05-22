const ExternalServiceService = require('./ExternalServiceService');

const createExternalService = async (req, res, next) => {
    try {
        const result = await ExternalServiceService.create(req.body, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getExternalServices = async (req, res, next) => {
    try {
        const result = await ExternalServiceService.findAll(req.query);

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getExternalServiceById = async (req, res, next) => {
    try {
        const result = await ExternalServiceService.findById(req.params.id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateExternalServiceStatus = async (req, res, next) => {
    try {
        const result = await ExternalServiceService.updateStatus(req.params.id, req.body, req.user);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExternalService,
    getExternalServices,
    getExternalServiceById,
    updateExternalServiceStatus
};
