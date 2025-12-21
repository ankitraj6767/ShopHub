import express from 'express';
import {
  submitTestimonial,
  getApprovedTestimonials,
  getMyTestimonials,
  updateMyTestimonial,
  deleteMyTestimonial,
  markHelpful,
  getAllTestimonialsAdmin,
  approveTestimonial,
  rejectTestimonial,
  toggleFeatured,
  updateDisplayOrder,
  deleteTestimonialAdmin,
  getTestimonialStats
} from '../controllers/testimonialController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getApprovedTestimonials);
router.post('/:id/helpful', markHelpful);

// Protected routes (logged in users)
router.post('/', protect, submitTestimonial);
router.get('/my', protect, getMyTestimonials);
router.put('/:id', protect, updateMyTestimonial);
router.delete('/:id', protect, deleteMyTestimonial);

// Admin routes
router.get('/admin/all', protect, admin, getAllTestimonialsAdmin);
router.get('/admin/stats', protect, admin, getTestimonialStats);
router.put('/admin/:id/approve', protect, admin, approveTestimonial);
router.put('/admin/:id/reject', protect, admin, rejectTestimonial);
router.put('/admin/:id/featured', protect, admin, toggleFeatured);
router.put('/admin/:id/order', protect, admin, updateDisplayOrder);
router.delete('/admin/:id', protect, admin, deleteTestimonialAdmin);

export default router;
