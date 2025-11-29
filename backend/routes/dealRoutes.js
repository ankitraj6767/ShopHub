import express from 'express';
import {
  getDealsOfDay,
  getActiveDeals,
  getAllDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  recordDealPurchase,
  generateDeals,
} from '../controllers/dealController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/today', getDealsOfDay);
router.get('/active', getActiveDeals);
router.get('/:id', getDeal);

// Protected routes
router.post('/:id/purchase', protect, recordDealPurchase);

// Admin routes
router.get('/', protect, admin, getAllDeals);
router.post('/', protect, admin, createDeal);
router.post('/generate', protect, admin, generateDeals);
router.put('/:id', protect, admin, updateDeal);
router.delete('/:id', protect, admin, deleteDeal);

export default router;
