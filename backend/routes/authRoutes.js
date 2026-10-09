const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  verifyEmail, 
  loginUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', authLimiter, loginUser);

router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/resend-verification', authLimiter, resendVerification);

router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
