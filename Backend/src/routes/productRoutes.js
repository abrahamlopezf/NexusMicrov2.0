const express = require('express');
const ProductController = require('../controllers/ProductController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('ADMIN', 'MANAGER'), ProductController.createProduct);
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), ProductController.updateProduct);
router.get('/', ProductController.getProducts);
router.get('/:id/full', ProductController.getProductFull);

module.exports = router;
