import express from 'express';
import {
  getFlashSales,
  getLiveFlashSale,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  purchaseFlashSaleItem,
} from '../controllers/flashSaleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getFlashSales).post(protect, admin, createFlashSale);
router.get('/live', getLiveFlashSale);
router
  .route('/:id')
  .get(getFlashSaleById)
  .put(protect, admin, updateFlashSale)
  .delete(protect, admin, deleteFlashSale);
router.post('/:id/purchase', protect, purchaseFlashSaleItem);

export default router;
