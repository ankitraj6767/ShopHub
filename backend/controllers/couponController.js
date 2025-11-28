import asyncHandler from 'express-async-handler';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { notifyNewCoupon } from './notificationController.js';

// @desc    Validate and apply coupon
// @route   POST /api/coupons/apply
// @access  Private
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, cartItems, cartTotal } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Please provide a coupon code');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    res.status(400);
    throw new Error('This coupon is no longer active');
  }

  // Check validity dates
  const now = new Date();
  if (now < coupon.validFrom) {
    res.status(400);
    throw new Error('This coupon is not yet valid');
  }

  if (now > coupon.validUntil) {
    res.status(400);
    throw new Error('This coupon has expired');
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('This coupon has reached its usage limit');
  }

  // Check per-user usage limit
  if (!coupon.canBeUsedByUser(req.user._id)) {
    res.status(400);
    throw new Error('You have already used this coupon');
  }

  // Check minimum purchase
  if (cartTotal < coupon.minimumPurchase) {
    res.status(400);
    throw new Error(
      `Minimum purchase of $${coupon.minimumPurchase.toFixed(2)} required`
    );
  }

  // Check applicable products/categories
  let applicableTotal = cartTotal;
  if (
    coupon.applicableCategories.length > 0 ||
    coupon.applicableProducts.length > 0
  ) {
    applicableTotal = 0;
    for (const item of cartItems) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // Check if product is excluded
      if (
        coupon.excludedProducts.some(
          (p) => p.toString() === product._id.toString()
        )
      ) {
        continue;
      }

      // Check if product matches criteria
      const categoryMatch =
        coupon.applicableCategories.length === 0 ||
        coupon.applicableCategories.includes(product.category);
      const productMatch =
        coupon.applicableProducts.length === 0 ||
        coupon.applicableProducts.some(
          (p) => p.toString() === product._id.toString()
        );

      if (categoryMatch || productMatch) {
        applicableTotal += product.price * item.quantity;
      }
    }

    if (applicableTotal === 0) {
      res.status(400);
      throw new Error('No eligible products in cart for this coupon');
    }
  }

  // Calculate discount
  const discount = coupon.calculateDiscount(applicableTotal);

  res.json({
    success: true,
    data: {
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: Number(discount.toFixed(2)),
      applicableTotal: Number(applicableTotal.toFixed(2)),
      minimumPurchase: coupon.minimumPurchase,
      maximumDiscount: coupon.maximumDiscount,
      validUntil: coupon.validUntil,
    },
  });
});

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = {};

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  if (req.query.code) {
    query.code = { $regex: req.query.code, $options: 'i' };
  }

  const count = await Coupon.countDocuments(query);
  const coupons = await Coupon.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: coupons,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Get single coupon (admin)
// @route   GET /api/coupons/:id
// @access  Private/Admin
export const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).populate(
    'createdBy',
    'name email'
  );

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  res.json({
    success: true,
    data: coupon,
  });
});

// @desc    Create coupon (admin)
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    minimumPurchase,
    maximumDiscount,
    validFrom,
    validUntil,
    usageLimit,
    usageLimitPerUser,
    applicableCategories,
    applicableProducts,
    excludedProducts,
  } = req.body;

  // Validate discount value
  if (discountType === 'percentage' && discountValue > 100) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100%');
  }

  // Check if code already exists
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    minimumPurchase: minimumPurchase || 0,
    maximumDiscount,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    usageLimit,
    usageLimitPerUser: usageLimitPerUser || 1,
    applicableCategories: applicableCategories || [],
    applicableProducts: applicableProducts || [],
    excludedProducts: excludedProducts || [],
    createdBy: req.user._id,
  });

  // Notify all users about new coupon
  await notifyNewCoupon(coupon);

  res.status(201).json({
    success: true,
    data: coupon,
  });
});

// @desc    Update coupon (admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = asyncHandler(async (req, res) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  // Validate discount value
  if (
    req.body.discountType === 'percentage' &&
    req.body.discountValue > 100
  ) {
    res.status(400);
    throw new Error('Percentage discount cannot exceed 100%');
  }

  // Check code uniqueness if changing
  if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({
      code: req.body.code.toUpperCase(),
    });
    if (existingCoupon) {
      res.status(400);
      throw new Error('Coupon code already exists');
    }
  }

  coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      code: req.body.code?.toUpperCase() || coupon.code,
      validFrom: req.body.validFrom
        ? new Date(req.body.validFrom)
        : coupon.validFrom,
      validUntil: req.body.validUntil
        ? new Date(req.body.validUntil)
        : coupon.validUntil,
    },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: coupon,
  });
});

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  await Coupon.deleteOne({ _id: coupon._id });

  res.json({
    success: true,
    message: 'Coupon deleted',
  });
});

// @desc    Toggle coupon active status (admin)
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Admin
export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json({
    success: true,
    message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`,
    data: coupon,
  });
});

// @desc    Get coupon usage statistics (admin)
// @route   GET /api/coupons/:id/stats
// @access  Private/Admin
export const getCouponStats = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id).populate({
    path: 'usedBy.user',
    select: 'name email',
  });

  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }

  const stats = {
    code: coupon.code,
    totalUsage: coupon.usageCount,
    usageLimit: coupon.usageLimit,
    remainingUsage: coupon.usageLimit
      ? coupon.usageLimit - coupon.usageCount
      : 'Unlimited',
    uniqueUsers: new Set(coupon.usedBy.map((u) => u.user?._id?.toString()))
      .size,
    recentUsage: coupon.usedBy.slice(-10).reverse(),
    isActive: coupon.isActive,
    isExpired: new Date() > coupon.validUntil,
    daysUntilExpiry: Math.ceil(
      (coupon.validUntil - new Date()) / (1000 * 60 * 60 * 24)
    ),
  };

  res.json({
    success: true,
    data: stats,
  });
});
