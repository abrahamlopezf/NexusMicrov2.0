const materialService = require('../services/MaterialService');

const createMaterial = async (req, res, next) => {
    try {
        const material = await materialService.createMaterial(req.body);
        res.status(201).json({
            success: true,
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const getAllMaterials = async (req, res, next) => {
    try {
        const materials = await materialService.getAllMaterials();
        res.status(200).json({
            success: true,
            data: materials
        });
    } catch (error) {
        next(error);
    }
};

const getMaterialById = async (req, res, next) => {
    try {
        const material = await materialService.getMaterialById(req.params.id);
        res.status(200).json({
            success: true,
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const updateMaterial = async (req, res, next) => {
    try {
        const material = await materialService.updateMaterial(req.params.id, req.body);
        res.status(200).json({
            success: true,
            data: material
        });
    } catch (error) {
        next(error);
    }
};

const deleteMaterial = async (req, res, next) => {
    try {
        await materialService.deleteMaterial(req.params.id);
        res.status(200).json({
            success: true,
            data: null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial
};
