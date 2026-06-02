const ProductRecipeService = require('./ProductRecipeService');

const createMaterialRule = async (req, res, next) => {
    try {
        const result = await ProductRecipeService.createMaterialRule(
            req.params.productId,
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

const getProductRecipe = async (req, res, next) => {
    try {
        const result = await ProductRecipeService.getProductRecipe(req.params.productId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const updateMaterialRule = async (req, res, next) => {
    try {
        const result = await ProductRecipeService.updateMaterialRule(
            req.params.productId,
            req.params.ruleId,
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

const deleteMaterialRule = async (req, res, next) => {
    try {
        await ProductRecipeService.deleteMaterialRule(
            req.params.productId,
            req.params.ruleId
        );

        res.status(200).json({
            success: true,
            message: 'Product material rule disabled successfully'
        });
    } catch (error) {
        next(error);
    }
};

const getSelectableMaterialOptions = async (req, res, next) => {
    try {
        const result = await ProductRecipeService.getSelectableMaterialOptions(
            req.params.productId,
            req.params.ruleId,
            req.query
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

module.exports = {
    createMaterialRule,
    getProductRecipe,
    updateMaterialRule,
    deleteMaterialRule,
    getSelectableMaterialOptions
};