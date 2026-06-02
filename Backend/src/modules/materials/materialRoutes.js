const express = require('express');
const router = express.Router();

const MaterialController = require('./materialController');

const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

// ═════════════════════════════════════════════════════
// MATERIAL CATEGORIES
// ═════════════════════════════════════════════════════

router.post(
    '/categories',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.createCategory
);

router.post(
    '/subcategories',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.createSubcategory
);

router.get(
    '/categories',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    MaterialController.getCategories
);

// ═════════════════════════════════════════════════════
// MATERIALS
// ═════════════════════════════════════════════════════

router.post(
    '/',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.createMaterial
);

router.get(
    '/',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    MaterialController.getMaterials
);

router.get(
    '/low-stock',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.getLowStockMaterials
);

router.get(
    '/:id',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    MaterialController.getMaterialById
);

router.put(
    '/:id',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.updateMaterial
);

router.patch(
    '/:id/cost',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    MaterialController.updateMaterialCost
);

module.exports = router;