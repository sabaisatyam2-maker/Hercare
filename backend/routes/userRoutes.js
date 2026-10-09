const express = require('express');
const router = express.Router();
const { updateOnboarding } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.put('/onboarding', protect, updateOnboarding);

module.exports = router;
