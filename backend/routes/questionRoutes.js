import express from 'express';
import {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  voteAnswer,
  deleteQuestion,
} from '../controllers/questionController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/product/:productId', getProductQuestions);
router.post('/', protect, askQuestion);
router.post('/:id/answer', protect, answerQuestion);
router.post('/:questionId/answers/:answerId/vote', protect, voteAnswer);
router.delete('/:id', protect, deleteQuestion);

export default router;
