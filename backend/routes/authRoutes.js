import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
} from '../controllers/authController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { registerValidation, loginValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.post('/logout', optionalAuth, logoutUser);
router.post('/refresh', refreshAccessToken);
router.get('/me', protect, getMe);

// Forgot password routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
