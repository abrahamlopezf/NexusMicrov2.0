const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const auth = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const { ROLES } = require('../utils/permissions');
const saleController = require('../controllers/saleController');

// Helper to catch validation schema errors
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Express-Validator rules
const validateCreateSale = [
    body('saleData.client_id').notEmpty().withMessage('Client ID is required'),
    body('itemsData').isArray({ min: 1 }).withMessage('At least one item is required in the sale'),
    body('itemsData.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('itemsData.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
    validateRequest
];

// POST /api/sales
router.post(
    '/',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    validateCreateSale,
    saleController.createSale
);

// GET /api/sales?page=1&limit=10
router.get(
    '/',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER),
    saleController.getAllSales
);

// GET /api/sales/pending
router.get(
    '/pending',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.getPendingSales
);

// GET /api/sales/deliveries
router.get(
    '/deliveries',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.getDeliveries
);

// PATCH /api/sales/:id/deliver
router.patch(
    '/:id/deliver',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.deliverSale
);

// GET /api/sales/:id
router.get(
    '/:id',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.getSaleById
);

// POST /api/sales/:id/payments
router.post(
    '/:id/payments',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.addPayment
);

module.exports = router;
