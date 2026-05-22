const express = require('express');
const router = express.Router();

const InventoryController = require('./inventoryController');

const auth = require('../../middlewares/authMiddleware');
const authorizeRoles = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');

// ═════════════════════════════════════════════════════
// INVENTORY MOVEMENTS
// ═════════════════════════════════════════════════════

router.post(
    '/movements',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.createMovement
);

router.get(
    '/movements',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.getMovements
);

router.get(
    '/lots',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.getLots
);

router.get(
    '/materials/:materialId/movements',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.getMovementsByMaterial
);

router.get(
    '/reusable-suggestions',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    InventoryController.getReusableSuggestions
);

router.post(
    '/reusable-returns',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.registerReusableReturn
);

router.post(
    '/sales/:saleId/material-requirements',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.createMaterialRequirement
);

router.get(
    '/sales/:saleId/material-requirements',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    InventoryController.getSaleMaterialRequirements
);

router.post(
    '/sales/:saleId/material-requirements/auto-base',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.generateAutoBaseRequirementsForSale
);

router.post(
    '/sales/:saleId/items/:saleItemId/select-recipe-material',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.selectRecipeMaterialForSaleItem
);

router.post(
    '/sales/:saleId/items/:saleItemId/consume-planned-materials',
    auth,
    authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    InventoryController.consumePlannedMaterialsForSaleItem
);

module.exports = router;
