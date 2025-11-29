import express from 'express';
import {
  trackProductView,
  getRecentlyViewed,
  getRecommendations,
  trackSearch,
  getSearchSuggestions,
  getQuickBuyList,
  saveCartTemplate,
  getSavedCarts,
  deleteSavedCart,
  createPriceAlert,
  getPriceAlerts,
  deletePriceAlert,
  getDashboardSummary,
  checkAllPriceAlerts,
} from '../controllers/activityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Product view tracking
router.post('/view/:productId', trackProductView);
router.get('/recently-viewed', getRecentlyViewed);

// Recommendations
router.get('/recommendations', getRecommendations);

// Search
router.post('/search', trackSearch);
router.get('/search-suggestions', getSearchSuggestions);

// Quick buy list
router.get('/quick-buy', getQuickBuyList);

// Saved cart templates
router.post('/save-cart', saveCartTemplate);
router.get('/saved-carts', getSavedCarts);
router.delete('/saved-carts/:cartId', deleteSavedCart);

// Price alerts
router.post('/price-alert', createPriceAlert);
router.get('/price-alerts', getPriceAlerts);
router.delete('/price-alert/:alertId', deletePriceAlert);

// Admin: Check all price alerts and send notifications
router.post('/check-price-alerts', admin, checkAllPriceAlerts);

// Dashboard summary
router.get('/dashboard', getDashboardSummary);

export default router;
