import express from 'express';
import {
  applyCoupon,
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStats,
  getAvailableCoupons,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validationMiddleware.js';
import { body, param } from 'express-validator';

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// @route   GET /api/coupons/available - Get available coupons for customer (must be before admin middleware)
router.get('/available', getAvailableCoupons);

// @route   POST /api/coupons/apply
router.post(
  '/apply',
  [
    body('code')
      .notEmpty()
      .withMessage('Coupon code is required')
      .isString()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be 3-20 characters'),
    body('orderTotal')
      .notEmpty()
      .withMessage('Order total is required')
      .isFloat({ min: 0 })
      .withMessage('Order total must be a positive number'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
  ],
  validate,
  applyCoupon
);

// @route   POST /api/coupons/validate
router.post(
  '/validate',
  [
    body('code')
      .notEmpty()
      .withMessage('Coupon code is required'),
  ],
  validate,
  applyCoupon
);

// Admin routes
router.use(admin);

// @route   GET /api/coupons
router.get('/', getCoupons);

// @route   GET /api/coupons/stats
router.get('/stats', getCouponStats);

// @route   GET /api/coupons/:id
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
  ],
  validate,
  getCoupon
);

// @route   PUT /api/coupons/:id/toggle
router.put(
  '/:id/toggle',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
  ],
  validate,
  toggleCouponStatus
);

// @route   POST /api/coupons
router.post(
  '/',
  [
    body('code')
      .notEmpty()
      .withMessage('Coupon code is required')
      .isString()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be 3-20 characters')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Coupon code must contain only uppercase letters and numbers'),
    body('discountType')
      .notEmpty()
      .withMessage('Discount type is required')
      .isIn(['percentage', 'fixed'])
      .withMessage('Discount type must be percentage or fixed'),
    body('discountValue')
      .notEmpty()
      .withMessage('Discount value is required')
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
    body('minOrderAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum order amount must be a positive number'),
    body('maxDiscount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum discount must be a positive number'),
    body('expiresAt')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format'),
    body('usageLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Usage limit must be at least 1'),
    body('usageLimitPerUser')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Usage limit per user must be at least 1'),
    body('applicableCategories')
      .optional()
      .isArray()
      .withMessage('Applicable categories must be an array'),
    body('applicableProducts')
      .optional()
      .isArray()
      .withMessage('Applicable products must be an array'),
    body('excludedProducts')
      .optional()
      .isArray()
      .withMessage('Excluded products must be an array'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters'),
  ],
  validate,
  createCoupon
);

// @route   PUT /api/coupons/:id
router.put(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
    body('code')
      .optional()
      .isString()
      .isLength({ min: 3, max: 20 })
      .withMessage('Coupon code must be 3-20 characters'),
    body('discountType')
      .optional()
      .isIn(['percentage', 'fixed'])
      .withMessage('Discount type must be percentage or fixed'),
    body('discountValue')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount value must be a positive number'),
  ],
  validate,
  updateCoupon
);

// @route   DELETE /api/coupons/:id
router.delete(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid coupon ID'),
  ],
  validate,
  deleteCoupon
);

export default router;
