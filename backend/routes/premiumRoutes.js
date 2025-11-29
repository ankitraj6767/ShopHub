import express from 'express';
import {
  getPremiumPlans,
  getPremiumStatus,
  subscribeToPremium,
  createPremiumOrder,
  verifyPremiumPayment,
  cancelPremium,
  toggleAutoRenew,
  getPremiumBenefits,
  getSubscriptionHistory,
  checkUserPremium,
  calculateDiscount,
} from '../controllers/premiumController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - get available plans
router.get('/plans', getPremiumPlans);

// Protected routes
router.get('/status', protect, getPremiumStatus);
router.post('/subscribe', protect, subscribeToPremium);
router.post('/create-order', protect, createPremiumOrder);
router.post('/verify-payment', protect, verifyPremiumPayment);
router.post('/cancel', protect, cancelPremium);
router.put('/auto-renew', protect, toggleAutoRenew);
router.get('/benefits', protect, getPremiumBenefits);
router.get('/history', protect, getSubscriptionHistory);
router.post('/calculate-discount', protect, calculateDiscount);

// Admin route
router.get('/check/:userId', protect, admin, checkUserPremium);

export default router;
