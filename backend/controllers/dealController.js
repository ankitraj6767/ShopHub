import asyncHandler from 'express-async-handler';
import Deal from '../models/Deal.js';
import Product from '../models/Product.js';

// @desc    Get active deals of the day
// @route   GET /api/deals/today
// @access  Public
export const getDealsOfDay = asyncHandler(async (req, res) => {
  const deals = await Deal.getActiveDealsOfDay();
  
  // Format deals for frontend
  const formattedDeals = deals.map(deal => ({
    _id: deal._id,
    product: deal.product,
    title: deal.title || deal.product?.name,
    dealType: deal.dealType,
    discountPercent: deal.discountPercent,
    salePrice: deal.salePrice,
    originalPrice: deal.originalPrice,
    stockRemaining: deal.stockRemaining,
    sold: deal.sold,
    endTime: deal.endTime,
    timeRemaining: deal.timeRemaining,
    isLive: deal.isLive,
  }));

  res.json({
    success: true,
    count: formattedDeals.length,
    data: formattedDeals,
  });
});

// @desc    Get all active deals
// @route   GET /api/deals/active
// @access  Public
export const getActiveDeals = asyncHandler(async (req, res) => {
  const { type, limit = 20 } = req.query;
  const deals = await Deal.getActiveDeals(type, parseInt(limit));
  
  res.json({
    success: true,
    count: deals.length,
    data: deals,
  });
});

// @desc    Get all deals (Admin)
// @route   GET /api/deals
// @access  Private/Admin
export const getAllDeals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (status === 'active') {
    const now = new Date();
    query.isActive = true;
    query.startTime = { $lte: now };
    query.endTime = { $gte: now };
  } else if (status === 'upcoming') {
    query.startTime = { $gt: new Date() };
  } else if (status === 'ended') {
    query.endTime = { $lt: new Date() };
  }
  
  if (type) {
    query.dealType = type;
  }

  const [deals, total] = await Promise.all([
    Deal.find(query)
      .populate('product', 'name images price stock')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Deal.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: deals,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Public
export const getDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id)
    .populate('product', 'name images price stock rating numReviews category brand description');
  
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  res.json({
    success: true,
    data: deal,
  });
});

// @desc    Create deal
// @route   POST /api/deals
// @access  Private/Admin
export const createDeal = asyncHandler(async (req, res) => {
  const {
    productId,
    title,
    dealType = 'deal_of_day',
    discountPercent,
    quantity = 100,
    startTime,
    endTime,
    priority = 0,
  } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Calculate sale price
  const originalPrice = product.price;
  const salePrice = originalPrice - (originalPrice * discountPercent / 100);

  // Check for overlapping deals on same product
  const now = new Date();
  const existingDeal = await Deal.findOne({
    product: productId,
    isActive: true,
    startTime: { $lte: new Date(endTime) },
    endTime: { $gte: new Date(startTime) },
  });

  if (existingDeal) {
    res.status(400);
    throw new Error('This product already has an active or overlapping deal');
  }

  const deal = await Deal.create({
    product: productId,
    title: title || product.name,
    dealType,
    discountPercent,
    salePrice: Math.round(salePrice * 100) / 100,
    originalPrice,
    quantity,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    priority,
    createdBy: req.user._id,
  });

  await deal.populate('product', 'name images price stock');

  res.status(201).json({
    success: true,
    message: 'Deal created successfully',
    data: deal,
  });
});

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private/Admin
export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  const {
    title,
    dealType,
    discountPercent,
    quantity,
    startTime,
    endTime,
    priority,
    isActive,
  } = req.body;

  // If discount percent changed, recalculate sale price
  if (discountPercent !== undefined && discountPercent !== deal.discountPercent) {
    deal.discountPercent = discountPercent;
    deal.salePrice = Math.round(deal.originalPrice - (deal.originalPrice * discountPercent / 100) * 100) / 100;
  }

  if (title !== undefined) deal.title = title;
  if (dealType !== undefined) deal.dealType = dealType;
  if (quantity !== undefined) deal.quantity = quantity;
  if (startTime !== undefined) deal.startTime = new Date(startTime);
  if (endTime !== undefined) deal.endTime = new Date(endTime);
  if (priority !== undefined) deal.priority = priority;
  if (isActive !== undefined) deal.isActive = isActive;

  await deal.save();
  await deal.populate('product', 'name images price stock');

  res.json({
    success: true,
    message: 'Deal updated successfully',
    data: deal,
  });
});

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private/Admin
export const deleteDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  await deal.deleteOne();

  res.json({
    success: true,
    message: 'Deal deleted successfully',
  });
});

// @desc    Record deal purchase
// @route   POST /api/deals/:id/purchase
// @access  Private
export const recordDealPurchase = asyncHandler(async (req, res) => {
  const { quantity = 1 } = req.body;
  const deal = await Deal.findById(req.params.id);
  
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }

  if (!deal.isLive) {
    res.status(400);
    throw new Error('This deal is not currently active');
  }

  if (deal.stockRemaining < quantity) {
    res.status(400);
    throw new Error('Not enough stock available for this deal');
  }

  deal.sold += quantity;
  await deal.save();

  res.json({
    success: true,
    message: 'Deal purchase recorded',
    data: {
      sold: deal.sold,
      stockRemaining: deal.stockRemaining,
    },
  });
});

// @desc    Create bulk deals (for daily/weekly generation)
// @route   POST /api/deals/generate
// @access  Private/Admin
export const generateDeals = asyncHandler(async (req, res) => {
  const { dealType = 'deal_of_day', count = 4, discountRange = { min: 20, max: 50 } } = req.body;

  // Get random products that don't have active deals
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Find products without active deals
  const activeDealsProducts = await Deal.find({
    isActive: true,
    endTime: { $gte: now },
  }).distinct('product');

  const products = await Product.find({
    _id: { $nin: activeDealsProducts },
    stock: { $gt: 10 },
    isActive: true,
  })
    .limit(count * 2)
    .sort({ rating: -1, numReviews: -1 });

  // Shuffle and pick random products
  const shuffled = products.sort(() => 0.5 - Math.random());
  const selectedProducts = shuffled.slice(0, count);

  const deals = [];
  for (const product of selectedProducts) {
    const discountPercent = Math.floor(
      Math.random() * (discountRange.max - discountRange.min + 1) + discountRange.min
    );
    const salePrice = Math.round((product.price - (product.price * discountPercent / 100)) * 100) / 100;

    const deal = await Deal.create({
      product: product._id,
      title: product.name,
      dealType,
      discountPercent,
      salePrice,
      originalPrice: product.price,
      quantity: Math.min(product.stock, 50),
      startTime: now,
      endTime: endOfDay,
      priority: Math.floor(Math.random() * 10),
      createdBy: req.user._id,
    });

    await deal.populate('product', 'name images price stock');
    deals.push(deal);
  }

  res.status(201).json({
    success: true,
    message: `${deals.length} deals generated successfully`,
    data: deals,
  });
});
