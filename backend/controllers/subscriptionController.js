import asyncHandler from 'express-async-handler';
import Subscription from '../models/Subscription.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Create a new subscription
// @route   POST /api/subscriptions
// @access  Private
export const createSubscription = asyncHandler(async (req, res) => {
  const { items, shippingAddress, frequency, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No subscription items provided');
  }

  // Validate products and calculate prices
  let subtotal = 0;
  const subscriptionItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (!product.isSubscribable) {
      res.status(400);
      throw new Error(`Product ${product.name} is not available for subscription`);
    }

    const price = product.price;
    const discountPercent = product.subscriptionDiscount || 5;
    const discountedPrice = price * (1 - discountPercent / 100);

    subscriptionItems.push({
      product: product._id,
      name: product.name,
      price,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      quantity: item.quantity || 1,
      image: product.images?.[0]?.url,
      variant: item.variant,
    });

    subtotal += discountedPrice * (item.quantity || 1);
  }

  // Calculate totals
  const discountAmount = items.reduce((acc, item, idx) => {
    return acc + (subscriptionItems[idx].price - subscriptionItems[idx].discountedPrice) * subscriptionItems[idx].quantity;
  }, 0);
  const shippingPrice = subtotal > 35 ? 0 : 5.99;
  const taxPrice = subtotal * 0.08;
  const totalPrice = subtotal + shippingPrice + taxPrice;

  // Calculate first delivery date (7 days from now)
  const nextDeliveryDate = new Date();
  nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7);

  const subscription = await Subscription.create({
    user: req.user._id,
    items: subscriptionItems,
    shippingAddress,
    frequency: frequency || 'monthly',
    discountPercent: subscriptionItems[0]?.discountedPrice ? 
      Math.round((1 - subscriptionItems[0].discountedPrice / subscriptionItems[0].price) * 100) : 5,
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    shippingPrice: Math.round(shippingPrice * 100) / 100,
    taxPrice: Math.round(taxPrice * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
    paymentMethod,
    nextDeliveryDate,
  });

  res.status(201).json({
    success: true,
    data: subscription,
  });
});

// @desc    Get user's subscriptions
// @route   GET /api/subscriptions
// @access  Private
export const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user._id })
    .populate('items.product', 'name images price')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: subscriptions.length,
    data: subscriptions,
  });
});

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
// @access  Private
export const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('items.product', 'name images price')
    .populate('deliveries.orderId');

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Check ownership
  if (subscription.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view this subscription');
  }

  res.json({
    success: true,
    data: subscription,
  });
});

// @desc    Update subscription frequency
// @route   PUT /api/subscriptions/:id/frequency
// @access  Private
export const updateFrequency = asyncHandler(async (req, res) => {
  const { frequency } = req.body;

  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.frequency = frequency;
  subscription.nextDeliveryDate = subscription.calculateNextDelivery();
  await subscription.save();

  res.json({
    success: true,
    data: subscription,
  });
});

// @desc    Pause subscription
// @route   PUT /api/subscriptions/:id/pause
// @access  Private
export const pauseSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.status = 'paused';
  subscription.pausedAt = new Date();
  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription paused',
    data: subscription,
  });
});

// @desc    Resume subscription
// @route   PUT /api/subscriptions/:id/resume
// @access  Private
export const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.status = 'active';
  subscription.pausedAt = undefined;
  subscription.nextDeliveryDate = subscription.calculateNextDelivery();
  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription resumed',
    data: subscription,
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();

  res.json({
    success: true,
    message: 'Subscription cancelled',
    data: subscription,
  });
});

// @desc    Skip next delivery
// @route   PUT /api/subscriptions/:id/skip
// @access  Private
export const skipNextDelivery = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.skipNextDelivery = true;
  subscription.nextDeliveryDate = subscription.calculateNextDelivery();
  await subscription.save();

  res.json({
    success: true,
    message: 'Next delivery will be skipped',
    data: subscription,
  });
});

// @desc    Update subscription items
// @route   PUT /api/subscriptions/:id/items
// @access  Private
export const updateSubscriptionItems = asyncHandler(async (req, res) => {
  const { items } = req.body;

  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Recalculate with new items
  let subtotal = 0;
  const subscriptionItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isSubscribable) {
      continue;
    }

    const price = product.price;
    const discountPercent = product.subscriptionDiscount || 5;
    const discountedPrice = price * (1 - discountPercent / 100);

    subscriptionItems.push({
      product: product._id,
      name: product.name,
      price,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      quantity: item.quantity || 1,
      image: product.images?.[0]?.url,
    });

    subtotal += discountedPrice * (item.quantity || 1);
  }

  const shippingPrice = subtotal > 35 ? 0 : 5.99;
  const taxPrice = subtotal * 0.08;
  const totalPrice = subtotal + shippingPrice + taxPrice;

  subscription.items = subscriptionItems;
  subscription.subtotal = Math.round(subtotal * 100) / 100;
  subscription.shippingPrice = Math.round(shippingPrice * 100) / 100;
  subscription.taxPrice = Math.round(taxPrice * 100) / 100;
  subscription.totalPrice = Math.round(totalPrice * 100) / 100;
  await subscription.save();

  res.json({
    success: true,
    data: subscription,
  });
});

// @desc    Update shipping address
// @route   PUT /api/subscriptions/:id/address
// @access  Private
export const updateShippingAddress = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  if (subscription.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  subscription.shippingAddress = shippingAddress;
  await subscription.save();

  res.json({
    success: true,
    data: subscription,
  });
});

// @desc    Process subscription deliveries (cron job)
// @route   POST /api/subscriptions/process-deliveries
// @access  Admin only
export const processDeliveries = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find subscriptions due for delivery
  const subscriptions = await Subscription.find({
    status: 'active',
    skipNextDelivery: false,
    nextDeliveryDate: { $gte: today, $lt: tomorrow },
  }).populate('items.product');

  const results = [];

  for (const subscription of subscriptions) {
    try {
      // Create order from subscription
      const orderItems = subscription.items.map(item => ({
        product: item.product._id,
        name: item.name,
        price: item.discountedPrice,
        quantity: item.quantity,
        image: item.image,
      }));

      const order = await Order.create({
        user: subscription.user,
        orderItems,
        shippingAddress: subscription.shippingAddress,
        paymentInfo: {
          method: subscription.paymentMethod,
          status: 'pending',
        },
        itemsPrice: subscription.subtotal,
        taxPrice: subscription.taxPrice,
        shippingPrice: subscription.shippingPrice,
        totalPrice: subscription.totalPrice,
        status: 'Pending',
        notes: `Subscription order - ${subscription.subscriptionNumber}`,
      });

      // Update subscription
      subscription.deliveries.push({
        orderId: order._id,
        deliveredAt: new Date(),
        status: 'created',
      });
      subscription.deliveryCount += 1;
      subscription.lastDeliveryDate = new Date();
      subscription.nextDeliveryDate = subscription.calculateNextDelivery();
      await subscription.save();

      results.push({
        subscriptionId: subscription._id,
        orderId: order._id,
        status: 'success',
      });
    } catch (error) {
      results.push({
        subscriptionId: subscription._id,
        status: 'failed',
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    processed: results.length,
    results,
  });
});
