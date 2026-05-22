const express = require('express');

const ProductController = require('./productController');
const ProductRecipeController = require('./productRecipeController');

const protect = require('../../middlewares/authMiddleware');
const restrictTo = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// Catálogo de productos
router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductController.createProduct);

router.put('/:id', restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'), ProductController.updateProduct);

router.get(
    '/',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ProductController.getProducts
);

router.get(
    '/:id/full',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ProductController.getProductFull
);

// Receta / reglas de materiales del producto
router.post(
    '/:productId/material-rules',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    ProductRecipeController.createMaterialRule
);

router.get(
    '/:productId/material-rules',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ProductRecipeController.getProductRecipe
);

router.put(
    '/:productId/material-rules/:ruleId',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    ProductRecipeController.updateMaterialRule
);

router.delete(
    '/:productId/material-rules/:ruleId',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    ProductRecipeController.deleteMaterialRule
);

router.get(
    '/:productId/material-rules/:ruleId/options',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ProductRecipeController.getSelectableMaterialOptions
);

module.exports = router;
