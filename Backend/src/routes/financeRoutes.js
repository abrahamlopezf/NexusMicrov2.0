const express = require('express');
const router = express.Router();
const FinanceController = require('../controllers/financeController');
const auth = require('../middlewares/authMiddleware');

// Protegemos todas las rutas de finanzas
router.use(auth);

router.get('/accounts', FinanceController.getAccounts);
router.get('/payments', FinanceController.getPayments);

module.exports = router;
