import Testimonial from '../models/Testimonial.js';
import Order from '../models/Order.js';
import asyncHandler from 'express-async-handler';

// @desc    Submit a new testimonial
// @route   POST /api/testimonials
// @access  Private
export const submitTestimonial = asyncHandler(async (req, res) => {
  const { rating, title, text, productId, productName, orderId } = req.body;

  // Check if user has already submitted a testimonial
  const existingTestimonial = await Testimonial.findOne({ 
    user: req.user._id,
    status: { $in: ['pending', 'approved'] }
  });

  if (existingTestimonial) {
    res.status(400);
    throw new Error('You have already submitted a testimonial. Please wait for approval or contact support.');
  }

  // Check if user has made any purchases (verified purchase)
  const hasOrders = await Order.findOne({ 
    user: req.user._id, 
    'paymentInfo.status': 'completed'
  });

  const testimonial = await Testimonial.create({
    user: req.user._id,
    rating,
    title,
    text,
    product: productId || null,
    productName: productName || '',
    orderReference: orderId || null,
    isVerifiedPurchase: !!hasOrders,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your testimonial! It will be visible after admin approval.',
    testimonial
  });
});

// @desc    Get all approved testimonials (public)
// @route   GET /api/testimonials
// @access  Public
export const getApprovedTestimonials = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1, featured } = req.query;
  const skip = (page - 1) * limit;

  const query = { status: 'approved' };
  if (featured === 'true') {
    query.isFeatured = true;
  }

  const testimonials = await Testimonial.find(query)
    .populate('user', 'name avatar')
    .populate('product', 'name images')
    .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Testimonial.countDocuments(query);

  // Increment view count for fetched testimonials
  const testimonialIds = testimonials.map(t => t._id);
  await Testimonial.updateMany(
    { _id: { $in: testimonialIds } },
    { $inc: { viewCount: 1 } }
  );

  res.json({
    success: true,
    testimonials,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get user's own testimonials
// @route   GET /api/testimonials/my
// @access  Private
export const getMyTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ user: req.user._id })
    .populate('product', 'name images')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    testimonials
  });
});

// @desc    Update user's testimonial (only if pending)
// @route   PUT /api/testimonials/:id
// @access  Private
export const updateMyTestimonial = asyncHandler(async (req, res) => {
  const { rating, title, text, productName } = req.body;

  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  if (testimonial.status !== 'pending') {
    res.status(400);
    throw new Error('Cannot edit testimonial after it has been reviewed');
  }

  testimonial.rating = rating || testimonial.rating;
  testimonial.title = title || testimonial.title;
  testimonial.text = text || testimonial.text;
  testimonial.productName = productName || testimonial.productName;

  await testimonial.save();

  res.json({
    success: true,
    message: 'Testimonial updated successfully',
    testimonial
  });
});

// @desc    Delete user's testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private
export const deleteMyTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  await testimonial.deleteOne();

  res.json({
    success: true,
    message: 'Testimonial deleted successfully'
  });
});

// @desc    Mark testimonial as helpful
// @route   POST /api/testimonials/:id/helpful
// @access  Public
export const markHelpful = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial || testimonial.status !== 'approved') {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  testimonial.helpfulCount += 1;
  await testimonial.save();

  res.json({
    success: true,
    helpfulCount: testimonial.helpfulCount
  });
});

// ==================== ADMIN CONTROLLERS ====================

// @desc    Get all testimonials (admin)
// @route   GET /api/testimonials/admin/all
// @access  Admin
export const getAllTestimonialsAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { text: { $regex: search, $options: 'i' } }
    ];
  }

  const testimonials = await Testimonial.find(query)
    .populate('user', 'name email avatar')
    .populate('product', 'name images')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Testimonial.countDocuments(query);
  const pendingCount = await Testimonial.countDocuments({ status: 'pending' });
  const approvedCount = await Testimonial.countDocuments({ status: 'approved' });
  const rejectedCount = await Testimonial.countDocuments({ status: 'rejected' });

  res.json({
    success: true,
    testimonials,
    stats: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Approve testimonial
// @route   PUT /api/testimonials/admin/:id/approve
// @access  Admin
export const approveTestimonial = asyncHandler(async (req, res) => {
  const { isFeatured, displayOrder, adminNotes } = req.body;

  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  testimonial.status = 'approved';
  testimonial.isFeatured = isFeatured || false;
  testimonial.displayOrder = displayOrder || 0;
  testimonial.adminNotes = adminNotes || '';
  testimonial.reviewedBy = req.user._id;
  testimonial.reviewedAt = new Date();
  testimonial.rejectionReason = '';

  await testimonial.save();

  res.json({
    success: true,
    message: 'Testimonial approved successfully',
    testimonial
  });
});

// @desc    Reject testimonial
// @route   PUT /api/testimonials/admin/:id/reject
// @access  Admin
export const rejectTestimonial = asyncHandler(async (req, res) => {
  const { rejectionReason, adminNotes } = req.body;

  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  testimonial.status = 'rejected';
  testimonial.rejectionReason = rejectionReason || 'Does not meet our guidelines';
  testimonial.adminNotes = adminNotes || '';
  testimonial.reviewedBy = req.user._id;
  testimonial.reviewedAt = new Date();
  testimonial.isFeatured = false;

  await testimonial.save();

  res.json({
    success: true,
    message: 'Testimonial rejected',
    testimonial
  });
});

// @desc    Toggle featured status
// @route   PUT /api/testimonials/admin/:id/featured
// @access  Admin
export const toggleFeatured = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  if (testimonial.status !== 'approved') {
    res.status(400);
    throw new Error('Only approved testimonials can be featured');
  }

  testimonial.isFeatured = !testimonial.isFeatured;
  await testimonial.save();

  res.json({
    success: true,
    message: testimonial.isFeatured ? 'Testimonial featured' : 'Testimonial unfeatured',
    testimonial
  });
});

// @desc    Update display order
// @route   PUT /api/testimonials/admin/:id/order
// @access  Admin
export const updateDisplayOrder = asyncHandler(async (req, res) => {
  const { displayOrder } = req.body;

  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  testimonial.displayOrder = displayOrder;
  await testimonial.save();

  res.json({
    success: true,
    message: 'Display order updated',
    testimonial
  });
});

// @desc    Delete testimonial (admin)
// @route   DELETE /api/testimonials/admin/:id
// @access  Admin
export const deleteTestimonialAdmin = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);

  if (!testimonial) {
    res.status(404);
    throw new Error('Testimonial not found');
  }

  await testimonial.deleteOne();

  res.json({
    success: true,
    message: 'Testimonial deleted successfully'
  });
});

// @desc    Get testimonial stats
// @route   GET /api/testimonials/admin/stats
// @access  Admin
export const getTestimonialStats = asyncHandler(async (req, res) => {
  const stats = await Testimonial.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  const ratingDistribution = await Testimonial.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  const recentSubmissions = await Testimonial.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  const featuredCount = await Testimonial.countDocuments({
    status: 'approved',
    isFeatured: true
  });

  res.json({
    success: true,
    stats: {
      byStatus: stats,
      ratingDistribution,
      recentSubmissions,
      featuredCount
    }
  });
});
