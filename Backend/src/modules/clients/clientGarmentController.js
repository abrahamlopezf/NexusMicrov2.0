const ClientGarmentService = require('./ClientGarmentService');

const createGarment = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.createGarment(
            req.params.clientId,
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getGarmentsByClient = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.getGarmentsByClient(
            req.params.clientId
        );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getGarmentById = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.getGarmentById(
            req.params.garmentId
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateGarment = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.updateGarment(
            req.params.garmentId,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deleteGarment = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.deleteGarment(
            req.params.garmentId,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createMeasurement = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.createMeasurement(
            req.params.garmentId,
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateMeasurement = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.updateMeasurement(
            req.params.measurementId,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const activateMeasurement = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.activateMeasurement(
            req.params.measurementId,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deleteMeasurement = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.deleteMeasurement(
            req.params.measurementId,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createAnnotation = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.createAnnotation(
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createGarmentAnnotation = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.createAnnotation({
            ...req.body,
            client_garment_id: req.params.garmentId
        }, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createMeasurementAnnotation = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.createAnnotation({
            ...req.body,
            client_garment_id: req.params.garmentId,
            measurement_id: req.params.measurementId
        }, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getAnnotationsByGarment = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.getAnnotationsByGarment(
            req.params.garmentId
        );

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateAnnotation = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.updateAnnotation(
            req.params.annotationId,
            req.body,
            req.user
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const deleteAnnotation = async (req, res, next) => {
    try {
        const result = await ClientGarmentService.deleteAnnotation(
            req.params.annotationId,
            req.user
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
    createGarment,
    getGarmentsByClient,
    getGarmentById,
    updateGarment,
    deleteGarment,

    createMeasurement,
    updateMeasurement,
    activateMeasurement,
    deleteMeasurement,

    createAnnotation,
    createGarmentAnnotation,
    createMeasurementAnnotation,
    getAnnotationsByGarment,
    updateAnnotation,
    deleteAnnotation
};