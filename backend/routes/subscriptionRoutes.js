import express from 'express';
import {
  createSubscription,
  getMySubscriptions,
  getSubscription,
  updateFrequency,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  skipNextDelivery,
  updateSubscriptionItems,
  updateShippingAddress,
  processDeliveries,
} from '../controllers/subscriptionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.route('/')
  .post(protect, createSubscription)
  .get(protect, getMySubscriptions);

router.route('/:id')
  .get(protect, getSubscription);

router.put('/:id/frequency', protect, updateFrequency);
router.put('/:id/pause', protect, pauseSubscription);
router.put('/:id/resume', protect, resumeSubscription);
router.put('/:id/cancel', protect, cancelSubscription);
router.put('/:id/skip', protect, skipNextDelivery);
router.put('/:id/items', protect, updateSubscriptionItems);
router.put('/:id/address', protect, updateShippingAddress);

// Admin routes
router.post('/process-deliveries', protect, admin, processDeliveries);

export default router;
