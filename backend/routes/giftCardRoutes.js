import express from 'express';
import {
  purchaseGiftCard,
  getPurchasedGiftCards,
  getRedeemedGiftCards,
  checkGiftCardBalance,
  redeemGiftCard,
  applyGiftCard,
  getGiftCardByCode,
  deactivateGiftCard,
} from '../controllers/giftCardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, purchaseGiftCard);
router.get('/purchased', protect, getPurchasedGiftCards);
router.get('/redeemed', protect, getRedeemedGiftCards);
router.get('/check/:code', checkGiftCardBalance);
router.post('/redeem', protect, redeemGiftCard);
router.post('/apply', protect, applyGiftCard);
router.get('/admin/:code', protect, admin, getGiftCardByCode);
router.put('/admin/:id/deactivate', protect, admin, deactivateGiftCard);

export default router;
