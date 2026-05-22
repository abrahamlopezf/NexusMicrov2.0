const express = require('express');

const SupplierController = require('./supplierController');
const PurchaseController = require('./purchaseController');
const ExternalServiceController = require('./externalServiceController');

const protect = require('../../middlewares/authMiddleware');
const restrictTo = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

// =====================================================
// SUPPLIERS BASE
// =====================================================
router.post('/', restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'), SupplierController.createSupplier);

router.get(
    '/',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    SupplierController.getSuppliers
);

// =====================================================
// PURCHASES
// IMPORTANTE: antes de /:id
// =====================================================
router.post(
    '/purchases/materials',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    PurchaseController.createMaterialPurchase
);

router.get(
    '/purchases',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    PurchaseController.getPurchases
);

router.get(
    '/purchases/:id',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    PurchaseController.getPurchaseById
);

// =====================================================
// EXTERNAL SERVICES
// IMPORTANTE: antes de /:id
// =====================================================
router.post(
    '/external-services',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    ExternalServiceController.createExternalService
);

router.get(
    '/external-services',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ExternalServiceController.getExternalServices
);

router.get(
    '/external-services/:id',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    ExternalServiceController.getExternalServiceById
);

router.patch(
    '/external-services/:id/status',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    ExternalServiceController.updateExternalServiceStatus
);

// =====================================================
// SUPPLIERS BY ID
// ESTAS VAN AL FINAL
// =====================================================
router.get(
    '/:id',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'EMPLOYEE'),
    SupplierController.getSupplierById
);

router.put(
    '/:id',
    restrictTo('SUPER_ADMIN', 'ADMIN', 'MANAGER'),
    SupplierController.updateSupplier
);

router.delete('/:id', restrictTo('SUPER_ADMIN', 'ADMIN'), SupplierController.deactivateSupplier);

module.exports = router;