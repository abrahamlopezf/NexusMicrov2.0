const MaterialService = require('./MaterialService');

const createCategory = async (req, res, next) => {
    try {
        const result = await MaterialService.createCategory(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const createSubcategory = async (req, res, next) => {
    try {
        const result = await MaterialService.createSubcategory(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const result = await MaterialService.getCategories();
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        next(error);
    }
};

const createMaterial = async (req, res, next) => {
    try {
        const result = await MaterialService.createMaterial(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMaterials = async (req, res, next) => {
    try {
        const result = await MaterialService.getMaterials(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getMaterialById = async (req, res, next) => {
    try {
        const result = await MaterialService.getMaterialById(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateMaterial = async (req, res, next) => {
    try {
        const result = await MaterialService.updateMaterial(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const updateMaterialCost = async (req, res, next) => {
    try {
        const result = await MaterialService.updateMaterialCost(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getLowStockMaterials = async (req, res, next) => {
    try {
        const result = await MaterialService.getLowStockMaterials();
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCategory,
    createSubcategory,
    getCategories,
    createMaterial,
    getMaterials,
    getMaterialById,
    updateMaterial,
    updateMaterialCost,
    getLowStockMaterials
};