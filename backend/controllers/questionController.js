import asyncHandler from 'express-async-handler';
import Question from '../models/Question.js';
import Product from '../models/Product.js';

// @desc    Get questions for a product
// @route   GET /api/questions/product/:productId
// @access  Public
export const getProductQuestions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { answered } = req.query;

  let query = { product: req.params.productId };

  if (answered === 'true') {
    query.isAnswered = true;
  } else if (answered === 'false') {
    query.isAnswered = false;
  }

  const count = await Question.countDocuments(query);
  const questions = await Question.find(query)
    .populate('user', 'name')
    .populate('answers.user', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: questions,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Ask a question
// @route   POST /api/questions
// @access  Private
export const askQuestion = asyncHandler(async (req, res) => {
  const { productId, question } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const newQuestion = await Question.create({
    product: productId,
    user: req.user._id,
    question,
  });

  await newQuestion.populate('user', 'name');

  res.status(201).json({
    success: true,
    data: newQuestion,
  });
});

// @desc    Answer a question
// @route   POST /api/questions/:id/answer
// @access  Private
export const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body;

  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Check if user is admin/seller for seller badge
  const isSellerAnswer = req.user.role === 'admin';

  question.answers.push({
    user: req.user._id,
    answer,
    isSellerAnswer,
  });

  await question.save();
  await question.populate('user', 'name');
  await question.populate('answers.user', 'name role');

  res.json({
    success: true,
    data: question,
  });
});

// @desc    Vote answer helpful
// @route   POST /api/questions/:questionId/answers/:answerId/vote
// @access  Private
export const voteAnswer = asyncHandler(async (req, res) => {
  const { questionId, answerId } = req.params;

  const question = await Question.findById(questionId);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  const answer = question.answers.id(answerId);

  if (!answer) {
    res.status(404);
    throw new Error('Answer not found');
  }

  // Check if already voted
  if (answer.votedBy.includes(req.user._id)) {
    // Remove vote
    answer.votedBy = answer.votedBy.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    answer.helpfulVotes = Math.max(0, answer.helpfulVotes - 1);
  } else {
    // Add vote
    answer.votedBy.push(req.user._id);
    answer.helpfulVotes += 1;
  }

  await question.save();

  res.json({
    success: true,
    data: question,
  });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  // Only allow owner or admin to delete
  if (question.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this question');
  }

  await question.deleteOne();

  res.json({
    success: true,
    message: 'Question deleted',
  });
});
