import express from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  updateWishlistItem,
  clearWishlist,
  moveToCart,
  checkWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/wishlist
router.get('/', getWishlist);

// @route   POST /api/wishlist
router.post(
  '/',
  [
    body('productId')
      .notEmpty()
      .withMessage('Product ID is required')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('notifyOnSale')
      .optional()
      .isBoolean()
      .withMessage('notifyOnSale must be a boolean'),
  ],
  validate,
  addToWishlist
);

// @route   GET /api/wishlist/check/:productId
router.get(
  '/check/:productId',
  [
    param('productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
  ],
  validate,
  checkWishlist
);

// @route   PUT /api/wishlist/:productId
router.put(
  '/:productId',
  [
    param('productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('notes')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('notifyOnSale')
      .optional()
      .isBoolean()
      .withMessage('notifyOnSale must be a boolean'),
  ],
  validate,
  updateWishlistItem
);

// @route   DELETE /api/wishlist/:productId
router.delete(
  '/:productId',
  [
    param('productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
  ],
  validate,
  removeFromWishlist
);

// @route   DELETE /api/wishlist
router.delete('/', clearWishlist);

// @route   POST /api/wishlist/:productId/move-to-cart
router.post(
  '/:productId/move-to-cart',
  [
    param('productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ],
  validate,
  moveToCart
);

export default router;
