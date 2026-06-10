const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const SaleTicketController = require('./saleTicketController');
const SalePosSummaryController = require('./salePosSummaryController');

const auth = require('../../middlewares/authMiddleware');
const authorize = require('../../middlewares/roleMiddleware');
const { ROLES } = require('../../utils/permissions');
const saleController = require('./saleController');

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

    // unit_price ya NO se exige porque el backend calcula precio con pricingEngine.
    // Solo validamos manual_price si viene desde frontend.
    body('itemsData.*.manual_price')
        .optional({ nullable: true })
        .isFloat({ min: 0 })
        .withMessage('Manual price cannot be negative'),

    body('itemsData.*.client_garment_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('client_garment_id must be a valid ID'),

    body('itemsData.*.measurement_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('measurement_id must be a valid ID'),

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
router.get('/', auth, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE), saleController.getAllSales);

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

router.get(
    '/:saleId/cost-summary',
    auth,
    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER),
    saleController.getSaleCostSummary
);

router.get(
    '/:saleId/pos-summary',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SalePosSummaryController.getPosSummary
);

router.get(
    '/tickets/:ticketId/pdf',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.getTicketPdf
);

router.get(
    '/tickets/:ticketId',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.getTicketById
);

router.patch(
    '/tickets/:ticketId/cancel',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.cancelTicket
);

// Sale Ticket Routes
router.get(
    '/:saleId/ticket',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.getTicketData
);

router.post(
    '/:saleId/ticket/issue',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.issueTicket
);

router.get(
    '/:saleId/tickets',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    SaleTicketController.getTicketsBySale
);

// PATCH /api/sales/:id/deliver
router.patch(
    '/:id/deliver',
    auth,
    authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE),
    saleController.deliverSale
);

module.exports = router;
