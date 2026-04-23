const express = require('express');
const authController = require('../controllers/authController');
const requireAuth = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas Públicas
router.post('/login', authController.login);

// Rutas Protegidas
router.use(requireAuth);
router.get('/me', authController.getMe);

module.exports = router;
