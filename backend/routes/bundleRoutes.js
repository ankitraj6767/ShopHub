import express from 'express';
import {
  getBundles,
  getFeaturedBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  addBundleToCart,
} from '../controllers/bundleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getBundles).post(protect, admin, createBundle);
router.get('/featured', getFeaturedBundles);
router
  .route('/:id')
  .get(getBundleById)
  .put(protect, admin, updateBundle)
  .delete(protect, admin, deleteBundle);
router.post('/:id/add-to-cart', protect, addBundleToCart);

export default router;
