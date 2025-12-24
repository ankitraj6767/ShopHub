import express from 'express';
import {
  getReturnEligibility,
  createReturn,
  getMyReturns,
  getReturnById,
  cancelReturn,
  addMessage,
  getAllReturns,
  getReturnStats,
  approveReturn,
  rejectReturn,
  updateReturnStatus,
  processRefund,
  addAdminNote,
  updateQualityCheck,
  getReturnConstants,
} from '../controllers/returnController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { mongoIdValidation, mongoOrderIdValidation, validate } from '../middleware/validationMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

// Public routes
router.get('/constants', getReturnConstants);

// User routes
router.get('/eligibility/:orderId', protect, mongoOrderIdValidation, getReturnEligibility);
router.get('/my-returns', protect, getMyReturns);
router.get('/:id', protect, mongoIdValidation, getReturnById);

router.post(
  '/',
  protect,
  [
    body('orderId').notEmpty().isMongoId().withMessage('Valid order ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.productId').isMongoId().withMessage('Valid product ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').notEmpty().withMessage('Return reason is required'),
    body('reasonDetail')
      .notEmpty()
      .isLength({ min: 20 })
      .withMessage('Please provide detailed reason (minimum 20 characters)'),
    body('type')
      .optional()
      .isIn(['return', 'exchange', 'replacement'])
      .withMessage('Invalid return type'),
    body('preferredRefundMethod')
      .optional()
      .isIn(['original_payment', 'wallet', 'bank_transfer', 'store_credit'])
      .withMessage('Invalid refund method'),
  ],
  validate,
  createReturn
);

router.put(
  '/:id/cancel',
  protect,
  mongoIdValidation,
  [body('reason').optional().isString().withMessage('Reason must be a string')],
  validate,
  cancelReturn
);

router.post(
  '/:id/message',
  protect,
  mongoIdValidation,
  [
    body('message')
      .notEmpty()
      .isLength({ min: 5 })
      .withMessage('Message must be at least 5 characters'),
  ],
  validate,
  addMessage
);

// Admin routes
router.get('/admin/all', protect, admin, getAllReturns);
router.get('/admin/stats', protect, admin, getReturnStats);

router.put(
  '/:id/approve',
  protect,
  admin,
  mongoIdValidation,
  [
    body('adminNote').optional().isString().withMessage('Admin note must be a string'),
    body('refundAmount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
    body('pickupDate').optional().isISO8601().withMessage('Invalid date format'),
    body('pickupTimeSlot').optional().isString().withMessage('Time slot must be a string'),
    body('schedulePickup').optional().isBoolean().withMessage('Schedule pickup must be boolean'),
  ],
  validate,
  approveReturn
);

router.put(
  '/:id/reject',
  protect,
  admin,
  mongoIdValidation,
  [
    body('rejectionReason')
      .notEmpty()
      .isLength({ min: 20 })
      .withMessage('Rejection reason must be at least 20 characters'),
  ],
  validate,
  rejectReturn
);

router.put(
  '/:id/status',
  protect,
  admin,
  mongoIdValidation,
  [
    body('status')
      .notEmpty()
      .isIn([
        'pending_approval', 'approved', 'pickup_scheduled', 'in_transit',
        'received', 'inspecting', 'inspection_passed', 'inspection_failed',
        'processing_refund', 'refund_completed', 'completed', 'cancelled',
      ])
      .withMessage('Invalid status'),
    body('note').optional().isString().withMessage('Note must be a string'),
    body('trackingNumber').optional().isString().withMessage('Tracking number must be a string'),
    body('carrier').optional().isString().withMessage('Carrier must be a string'),
  ],
  validate,
  updateReturnStatus
);

router.put(
  '/:id/refund',
  protect,
  admin,
  mongoIdValidation,
  [
    body('refundMethod')
      .optional()
      .isIn(['original_payment', 'wallet', 'bank_transfer', 'store_credit'])
      .withMessage('Invalid refund method'),
    body('transactionId').optional().isString().withMessage('Transaction ID must be a string'),
    body('note').optional().isString().withMessage('Note must be a string'),
    body('adjustedAmount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  ],
  validate,
  processRefund
);

router.post(
  '/:id/admin-note',
  protect,
  admin,
  mongoIdValidation,
  [
    body('note')
      .notEmpty()
      .isLength({ min: 5 })
      .withMessage('Note must be at least 5 characters'),
  ],
  validate,
  addAdminNote
);

router.put(
  '/:id/quality-check',
  protect,
  admin,
  mongoIdValidation,
  [
    body('passed').isBoolean().withMessage('Passed must be boolean'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    body('issues').optional().isArray().withMessage('Issues must be an array'),
  ],
  validate,
  updateQualityCheck
);

export default router;
