const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Optionally apply authentication / role-based limits here
// router.use(authMiddleware, authorizeRoles('ADMIN'));

router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.post('/retry/:id', jobController.retryJob);

module.exports = router;
