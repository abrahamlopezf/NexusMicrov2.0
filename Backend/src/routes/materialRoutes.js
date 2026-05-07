const express = require('express');
const materialController = require('../controllers/materialController');
const auth = require('../middlewares/authMiddleware');
const restrictTo = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(auth);

router.get('/', materialController.getAllMaterials);
router.get('/:id', materialController.getMaterialById);

router.post('/', restrictTo('ADMIN', 'MANAGER'), materialController.createMaterial);
router.put('/:id', restrictTo('ADMIN', 'MANAGER'), materialController.updateMaterial);
router.delete('/:id', restrictTo('ADMIN', 'MANAGER'), materialController.deleteMaterial);

module.exports = router;
