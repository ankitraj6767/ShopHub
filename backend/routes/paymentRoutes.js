import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
  getPaymentConfig,
  processRefund,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  processRazorpayRefund,
} from '../controllers/paymentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/config', getPaymentConfig);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/razorpay/webhook', razorpayWebhook);

// Protected routes - Stripe
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Protected routes - Razorpay
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);

// Admin routes
router.post('/refund', protect, admin, processRefund);
router.post('/razorpay/refund', protect, admin, processRazorpayRefund);

export default router;
