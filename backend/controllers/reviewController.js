import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { sort, rating, verified } = req.query;

  let query = { product: req.params.productId, isApproved: true };

  // Filter by rating
  if (rating) {
    query.rating = parseInt(rating);
  }

  // Filter by verified purchase
  if (verified === 'true') {
    query.isVerifiedPurchase = true;
  }

  // Sorting options
  let sortOption = { createdAt: -1 };
  switch (sort) {
    case 'newest':
      sortOption = { createdAt: -1 };
      break;
    case 'oldest':
      sortOption = { createdAt: 1 };
      break;
    case 'highest':
      sortOption = { rating: -1, createdAt: -1 };
      break;
    case 'lowest':
      sortOption = { rating: 1, createdAt: -1 };
      break;
    case 'helpful':
      sortOption = { helpfulVotes: -1, createdAt: -1 };
      break;
  }

  const count = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('user', 'name')
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  // Get rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: { product: reviews[0]?.product || null, isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingDistribution.forEach((r) => {
    distribution[r._id] = r.count;
  });

  res.json({
    success: true,
    data: reviews,
    ratingDistribution: distribution,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment, images, pros, cons, isRecommended } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  // Check if user has purchased this product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    status: { $in: ['Paid', 'Shipped', 'Delivered'] },
  });

  // Process images
  let processedImages = [];
  if (images && Array.isArray(images)) {
    processedImages = images.slice(0, 5).map((img) => {
      if (typeof img === 'string') {
        return { url: img, alt: `Review image` };
      }
      return img;
    });
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    images: processedImages,
    pros: pros || [],
    cons: cons || [],
    isRecommended: isRecommended !== false,
    order: hasPurchased?._id,
    isVerifiedPurchase: !!hasPurchased,
  });

  // Update product rating
  await product.updateRating();

  const populatedReview = await Review.findById(review._id).populate('user', 'name');

  res.status(201).json({
    success: true,
    data: populatedReview,
  });
});

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  review.rating = req.body.rating || review.rating;
  review.title = req.body.title ?? review.title;
  review.comment = req.body.comment || review.comment;
  review.pros = req.body.pros || review.pros;
  review.cons = req.body.cons || review.cons;
  review.isRecommended = req.body.isRecommended ?? review.isRecommended;

  // Process images
  if (req.body.images && Array.isArray(req.body.images)) {
    review.images = req.body.images.slice(0, 5).map((img) => {
      if (typeof img === 'string') {
        return { url: img, alt: 'Review image' };
      }
      return img;
    });
  }

  const updatedReview = await review.save();

  // Update product rating
  const product = await Product.findById(review.product);
  if (product) {
    await product.updateRating();
  }

  const populatedReview = await Review.findById(updatedReview._id).populate('user', 'name');

  res.json({
    success: true,
    data: populatedReview,
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review or is admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const productId = review.product;

  await review.deleteOne();

  // Update product rating
  const product = await Product.findById(productId);
  if (product) {
    await product.updateRating();
  }

  res.json({
    success: true,
    message: 'Review removed',
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my
// @access  Private
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name images')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

// @desc    Check if user can review a product
// @route   GET /api/reviews/can-review/:productId
// @access  Private
export const canReviewProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Check if already reviewed
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existingReview) {
    return res.json({
      success: true,
      canReview: false,
      reason: 'already_reviewed',
      existingReview,
    });
  }

  // Check if purchased (for verified badge, but allow all users to review)
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    status: { $in: ['Paid', 'Shipped', 'Delivered'] },
  });

  // Allow all authenticated users to review
  res.json({
    success: true,
    canReview: true,
    isVerifiedPurchase: !!hasPurchased,
  });
});

// @desc    Vote review as helpful
// @route   POST /api/reviews/:id/vote
// @access  Private
export const voteReview = asyncHandler(async (req, res) => {
  const { helpful } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Can't vote on own review
  if (review.user.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot vote on your own review');
  }

  // Check if already voted
  const existingVoteIndex = review.votedBy.findIndex(
    (v) => v.user.toString() === req.user._id.toString()
  );

  if (existingVoteIndex !== -1) {
    const existingVote = review.votedBy[existingVoteIndex];
    
    // If same vote, remove it (toggle off)
    if (existingVote.helpful === helpful) {
      review.votedBy.splice(existingVoteIndex, 1);
      if (helpful) {
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      }
    } else {
      // Change vote
      existingVote.helpful = helpful;
      existingVote.votedAt = new Date();
      if (helpful) {
        review.helpfulVotes += 1;
      } else {
        review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
      }
    }
  } else {
    // New vote
    review.votedBy.push({
      user: req.user._id,
      helpful,
      votedAt: new Date(),
    });
    if (helpful) {
      review.helpfulVotes += 1;
    }
  }

  await review.save();

  res.json({
    success: true,
    message: helpful ? 'Marked as helpful' : 'Vote recorded',
    helpfulVotes: review.helpfulVotes,
  });
});

// @desc    Admin response to review
// @route   POST /api/reviews/:id/respond
// @access  Private/Admin
export const respondToReview = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.adminResponse = {
    comment,
    respondedAt: new Date(),
    respondedBy: req.user._id,
  };

  await review.save();

  const populatedReview = await Review.findById(review._id)
    .populate('user', 'name')
    .populate('adminResponse.respondedBy', 'name');

  res.json({
    success: true,
    data: populatedReview,
  });
});

// @desc    Get all reviews (admin)
// @route   GET /api/reviews/admin
// @access  Private/Admin
export const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = {};

  if (req.query.isApproved !== undefined) {
    query.isApproved = req.query.isApproved === 'true';
  }

  if (req.query.rating) {
    query.rating = parseInt(req.query.rating);
  }

  const count = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: reviews,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Approve/Reject review (admin)
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
export const approveReview = asyncHandler(async (req, res) => {
  const { isApproved } = req.body;
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.isApproved = isApproved;
  await review.save();

  // Update product rating
  const product = await Product.findById(review.product);
  if (product) {
    await product.updateRating();
  }

  res.json({
    success: true,
    message: isApproved ? 'Review approved' : 'Review rejected',
    data: review,
  });
});

// @desc    Get review statistics for a product
// @route   GET /api/reviews/product/:productId/stats
// @access  Public
export const getProductReviewStats = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const stats = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        recommendedCount: {
          $sum: { $cond: ['$isRecommended', 1, 0] },
        },
        verifiedCount: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] },
        },
      },
    },
  ]);

  const ratingDistribution = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), isApproved: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingDistribution.forEach((r) => {
    distribution[r._id] = r.count;
  });

  const result = stats[0] || {
    averageRating: 0,
    totalReviews: 0,
    recommendedCount: 0,
    verifiedCount: 0,
  };

  res.json({
    success: true,
    data: {
      ...result,
      recommendedPercentage:
        result.totalReviews > 0
          ? ((result.recommendedCount / result.totalReviews) * 100).toFixed(0)
          : 0,
      verifiedPercentage:
        result.totalReviews > 0
          ? ((result.verifiedCount / result.totalReviews) * 100).toFixed(0)
          : 0,
      ratingDistribution: distribution,
    },
  });
});
