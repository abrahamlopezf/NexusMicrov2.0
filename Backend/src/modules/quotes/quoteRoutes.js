const express = require('express');
const QuoteController = require('./QuoteController');
const protect = require('../../middlewares/authMiddleware');
const restrictTo = require('../../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', QuoteController.createQuote);
router.get('/', QuoteController.getQuotes);
router.get('/:id', QuoteController.getQuoteById);

// PDF Generation
router.get('/:id/pdf', QuoteController.generatePdf);

// Actions
router.post('/:id/approve', restrictTo('ADMIN', 'MANAGER'), QuoteController.approveQuote);
router.post('/:id/convert', restrictTo('ADMIN', 'MANAGER', 'SELLER'), QuoteController.convertToSale);

module.exports = router;
