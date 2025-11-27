import express from 'express';
import {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
} from '../controllers/addressController.js';
import { protect } from '../middleware/authMiddleware.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/addresses
router.get('/', getAddresses);

// @route   GET /api/addresses/default
router.get('/default', getDefaultAddress);

// @route   GET /api/addresses/:id
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid address ID'),
  ],
  validate,
  getAddress
);

// @route   POST /api/addresses
router.post(
  '/',
  [
    body('fullName')
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[\d\s-]{10,}$/)
      .withMessage('Please enter a valid phone number'),
    body('addressLine1')
      .notEmpty()
      .withMessage('Address line 1 is required')
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be 5-200 characters'),
    body('addressLine2')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Address line 2 must not exceed 200 characters'),
    body('city')
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be 2-100 characters'),
    body('state')
      .notEmpty()
      .withMessage('State is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be 2-100 characters'),
    body('postalCode')
      .notEmpty()
      .withMessage('Postal code is required')
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be 3-20 characters'),
    body('country')
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be 2-100 characters'),
    body('addressType')
      .optional()
      .isIn(['home', 'work', 'other'])
      .withMessage('Address type must be home, work, or other'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault must be a boolean'),
    body('landmark')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Landmark must not exceed 200 characters'),
    body('deliveryInstructions')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Delivery instructions must not exceed 500 characters'),
  ],
  validate,
  createAddress
);

// @route   PUT /api/addresses/:id
router.put(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid address ID'),
    body('fullName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be 2-100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-]{10,}$/)
      .withMessage('Please enter a valid phone number'),
    body('addressLine1')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Address must be 5-200 characters'),
    body('city')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('City must be 2-100 characters'),
    body('state')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be 2-100 characters'),
    body('postalCode')
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage('Postal code must be 3-20 characters'),
    body('country')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Country must be 2-100 characters'),
    body('addressType')
      .optional()
      .isIn(['home', 'work', 'other'])
      .withMessage('Address type must be home, work, or other'),
  ],
  validate,
  updateAddress
);

// @route   DELETE /api/addresses/:id
router.delete(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid address ID'),
  ],
  validate,
  deleteAddress
);

// @route   PUT /api/addresses/:id/default
router.put(
  '/:id/default',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid address ID'),
  ],
  validate,
  setDefaultAddress
);

export default router;
