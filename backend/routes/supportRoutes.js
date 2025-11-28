import express from 'express';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  getAllTickets,
  rateTicket,
  getFAQs,
  voteFAQ,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  chatbotResponse,
  getQuickReplySuggestions,
  assignTicket,
  closeTicket,
} from '../controllers/supportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/faqs', getFAQs);
router.post('/faqs/:id/vote', voteFAQ);
router.post('/chat', chatbotResponse);
router.get('/quick-replies', getQuickReplySuggestions);

// Protected routes
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicketById);
router.post('/tickets/:id/messages', protect, addMessage);
router.post('/tickets/:id/rate', protect, rateTicket);
router.patch('/tickets/:id/close', protect, closeTicket);

// Admin routes
router.get('/admin/tickets', protect, admin, getAllTickets);
router.patch('/admin/tickets/:id/status', protect, admin, updateTicketStatus);
router.patch('/admin/tickets/:id/assign', protect, admin, assignTicket);
router.post('/admin/faqs', protect, admin, createFAQ);
router.put('/admin/faqs/:id', protect, admin, updateFAQ);
router.delete('/admin/faqs/:id', protect, admin, deleteFAQ);

export default router;
