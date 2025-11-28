import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  updateUserRole,
  deleteUser,
  getWalletBalance,
  useWalletBalance,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  updateProfileValidation,
  mongoIdValidation,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// User routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfileValidation, updateUserProfile);

// Wallet routes
router.get('/wallet', protect, getWalletBalance);
router.post('/wallet/use', protect, useWalletBalance);

// Admin routes
router.get('/', protect, admin, getUsers);
router.get('/:id', protect, admin, mongoIdValidation, getUserById);
router.put('/:id', protect, admin, mongoIdValidation, updateUser);
router.put('/:id/role', protect, admin, mongoIdValidation, updateUserRole);
router.delete('/:id', protect, admin, mongoIdValidation, deleteUser);

export default router;
