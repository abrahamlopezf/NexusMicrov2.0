const InventoryService = require('./InventoryService');

const createMovement = async (req, res, next) => {
    try {
        const result = await InventoryService.createMovement(req.body, req.user);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getMovements = async (req, res, next) => {
    try {
        const result = await InventoryService.getMovements(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

const getMovementsByMaterial = async (req, res, next) => {
    try {
        const result = await InventoryService.getMovementsByMaterial(req.params.materialId);
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        next(error);
    }
};

const getLots = async (req, res, next) => {
    try {
        const result = await InventoryService.getLots(req.query);
        res.status(200).json({ success: true, count: result.length, data: result });
    } catch (error) {
        next(error);
    }
};

const getReusableSuggestions = async (req, res, next) => {
    try {
        const result = await InventoryService.getReusableSuggestions(req.query);

        res.status(200).json({
            success: true,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const registerReusableReturn = async (req, res, next) => {
    try {
        const result = await InventoryService.registerReusableReturn(req.body, req.user);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const createMaterialRequirement = async (req, res, next) => {
    try {
        const result = await InventoryService.createMaterialRequirement(
            req.params.saleId,
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

const getSaleMaterialRequirements = async (req, res, next) => {
    try {
        const result = await InventoryService.getSaleMaterialRequirements(req.params.saleId);

        res.status(200).json({
            success: true,
            count: result.count,
            summary: result.summary,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

const generateAutoBaseRequirementsForSale = async (req, res, next) => {
    try {
        const result = await InventoryService.generateAutoBaseRequirementsForSale(
            req.params.saleId,
            req.user
        );

        res.status(201).json({
            success: true,
            created_count: result.created_count,
            skipped_count: result.skipped_count,
            created: result.created,
            skipped: result.skipped
        });
    } catch (error) {
        next(error);
    }
};

const selectRecipeMaterialForSaleItem = async (req, res, next) => {
    try {
        const result = await InventoryService.selectRecipeMaterialForSaleItem(
            req.params.saleId,
            req.params.saleItemId,
            req.body,
            req.user
        );

        res.status(201).json({
            success: true,
            created_count: result.created_count,
            skipped_count: result.skipped_count,
            created: result.created,
            skipped: result.skipped,
            recipe_rule: result.recipe_rule,
            selected_material: result.selected_material,
            selected_lot: result.selected_lot
        });
    } catch (error) {
        next(error);
    }
};

const consumePlannedMaterialsForSaleItem = async (req, res, next) => {
    try {
        const result = await InventoryService.consumePlannedMaterialsForSaleItem(
            req.params.saleId,
            req.params.saleItemId,
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

module.exports = {
    createMovement,
    getMovements,
    getMovementsByMaterial,
    getLots,
    getReusableSuggestions,
    registerReusableReturn,
    createMaterialRequirement,
    getSaleMaterialRequirements,
    generateAutoBaseRequirementsForSale,
    selectRecipeMaterialForSaleItem,
    consumePlannedMaterialsForSaleItem
};
