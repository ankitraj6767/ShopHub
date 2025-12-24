import express from 'express';
import {
  getDashboardAnalytics,
  getRevenueBreakdown,
  getCustomerAnalytics,
  getProductAnalytics,
  getRevenueAnalytics,
  getRevenueStats,
  getReturnAnalytics
} from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All analytics routes require admin access
router.use(protect, admin);

router.get('/dashboard', getDashboardAnalytics);
router.get('/revenue', getRevenueBreakdown);
router.get('/customers', getCustomerAnalytics);
router.get('/products', getProductAnalytics);
router.get('/revenue-analytics', getRevenueAnalytics);
router.get('/revenue-stats', getRevenueStats);
router.get('/returns', getReturnAnalytics);

export default router;
