import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// Alias for handleValidation (used after custom validation arrays)
export const validate = handleValidation;

// User validation rules
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidation,
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone cannot exceed 20 characters'),
  handleValidation,
];

// Product validation rules
export const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Name cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Electronics',
      'Clothing',
      'Home & Garden',
      'Sports & Outdoors',
      'Books',
      'Toys & Games',
      'Health & Beauty',
      'Automotive',
      'Food & Grocery',
      'Other',
    ])
    .withMessage('Invalid category'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 100 })
    .withMessage('Brand cannot exceed 100 characters'),
  body('stock')
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  handleValidation,
];

// Order validation rules
export const orderValidation = [
  body('orderItems')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('orderItems.*.product')
    .notEmpty()
    .withMessage('Product ID is required'),
  body('orderItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),
  body('paymentInfo.method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['Credit Card', 'PayPal', 'Cash on Delivery', 'Stripe', 'UPI', 'Razorpay'])
    .withMessage('Invalid payment method'),
  handleValidation,
];

// Review validation rules
export const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  handleValidation,
];

// Pagination validation
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidation,
];

// MongoDB ID validation
export const mongoIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidation,
];
