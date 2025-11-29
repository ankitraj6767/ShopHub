import express from 'express';
import {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  getOrders,
  updateOrderStatus,
  getOrderStats,
  cancelOrder,
  requestReturn,
  processReturn,
  updateTracking,
  getReturnRequests,
  processRefund,
  downloadInvoice,
  getBuyAgainItems,
  reorder,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { orderValidation, mongoIdValidation, validate } from '../middleware/validationMiddleware.js';
import { orderLimiter } from '../middleware/rateLimitMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Admin routes (must be before :id routes to avoid conflicts)
router.get('/admin/stats', protect, admin, getOrderStats);
router.get('/admin/returns', protect, admin, getReturnRequests);
router.get('/', protect, admin, getOrders);
router.put('/:id/status', protect, admin, mongoIdValidation, updateOrderStatus);
router.put(
  '/:id/tracking',
  protect,
  admin,
  mongoIdValidation,
  [
    body('carrier').optional().isString().withMessage('Carrier must be a string'),
    body('trackingNumber').optional().isString().withMessage('Tracking number must be a string'),
    body('trackingUrl').optional().isURL().withMessage('Invalid tracking URL'),
    body('estimatedDelivery').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  updateTracking
);
router.put(
  '/:id/return/process',
  protect,
  admin,
  mongoIdValidation,
  [
    body('action')
      .notEmpty()
      .withMessage('Action is required')
      .isIn(['approve', 'reject'])
      .withMessage('Action must be approve or reject'),
    body('adminNote').optional().isString().withMessage('Admin note must be a string'),
    body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  ],
  validate,
  processReturn
);
router.put(
  '/:id/refund',
  protect,
  admin,
  mongoIdValidation,
  [
    body('refundMethod').optional().isString().withMessage('Refund method must be a string'),
    body('transactionId').optional().isString().withMessage('Transaction ID must be a string'),
    body('note').optional().isString().withMessage('Note must be a string'),
  ],
  validate,
  processRefund
);

// User routes
router.post('/', protect, orderLimiter, orderValidation, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/buy-again', protect, getBuyAgainItems);
router.get('/:id', protect, mongoIdValidation, getOrderById);
router.put('/:id/pay', protect, mongoIdValidation, updateOrderToPaid);
router.post('/:id/reorder', protect, mongoIdValidation, reorder);
router.put(
  '/:id/cancel',
  protect,
  mongoIdValidation,
  [
    body('reason')
      .notEmpty()
      .withMessage('Cancellation reason is required')
      .isLength({ min: 10 })
      .withMessage('Reason must be at least 10 characters'),
  ],
  validate,
  cancelOrder
);
router.post(
  '/:id/return',
  protect,
  mongoIdValidation,
  [
    body('reason')
      .notEmpty()
      .withMessage('Return reason is required')
      .isLength({ min: 20 })
      .withMessage('Reason must be at least 20 characters'),
    body('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
    body('items.*.productId')
      .optional()
      .isMongoId()
      .withMessage('Invalid product ID'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
  ],
  validate,
  requestReturn
);

// Invoice download
router.get('/:id/invoice', protect, mongoIdValidation, downloadInvoice);

export default router;
