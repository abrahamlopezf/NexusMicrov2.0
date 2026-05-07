const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', purchaseController.getPurchaseOrders);
router.post('/', purchaseController.createPurchaseOrder);
router.get('/:id', purchaseController.getPurchaseOrderById);
router.post('/:id/receive', purchaseController.receivePurchaseOrder);

module.exports = router;
