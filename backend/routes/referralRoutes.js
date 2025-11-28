import express from 'express';
import {
  getReferralInfo,
  validateReferralCode,
  applyReferralCode,
  completeReferral,
  getReferralLeaderboard,
} from '../controllers/referralController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getReferralInfo);
router.get('/validate/:code', validateReferralCode);
router.get('/leaderboard', getReferralLeaderboard);
router.post('/apply', protect, applyReferralCode);
router.post('/complete', protect, completeReferral);

export default router;
