import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentConfig,
  processRefund,
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/config', getPaymentConfig);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected routes
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Admin routes
router.post('/refund', protect, admin, processRefund);

export default router;
