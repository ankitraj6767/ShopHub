import express from 'express';
import {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  canReviewProduct,
  voteReview,
  getProductReviewStats,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { reviewValidation, mongoIdValidation, validate } from '../middleware/validationMiddleware.js';
import { body, param } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/product/:productId', getProductReviews);
router.get(
  '/product/:productId/stats',
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
  ],
  validate,
  getProductReviewStats
);

// User routes
router.post('/', protect, reviewValidation, createReview);
router.get('/my', protect, getMyReviews);
router.get('/can-review/:productId', protect, canReviewProduct);
router.put('/:id', protect, mongoIdValidation, updateReview);
router.delete('/:id', protect, mongoIdValidation, deleteReview);
router.post(
  '/:id/vote',
  protect,
  mongoIdValidation,
  [
    body('helpful')
      .isBoolean()
      .withMessage('Helpful must be a boolean'),
  ],
  validate,
  voteReview
);

export default router;
