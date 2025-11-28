import express from 'express';
import {
  getLoyaltyPoints,
  earnPoints,
  redeemPoints,
  getLeaderboard,
  getTierInfo,
} from '../controllers/loyaltyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/tiers', getTierInfo);
router.get('/leaderboard', getLeaderboard);
router.get('/', protect, getLoyaltyPoints);
router.post('/earn', protect, earnPoints);
router.post('/redeem', protect, redeemPoints);

export default router;
