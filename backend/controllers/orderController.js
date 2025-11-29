import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendEmail, emailTemplates } from '../utils/email.js';
import User from '../models/User.js';
import { generateInvoicePDF } from '../utils/pdf.js';
import Notification from '../models/Notification.js';
import { notifyOrderStatus } from './notificationController.js';
import LoyaltyPoint from '../models/LoyaltyPoint.js';
import Referral from '../models/Referral.js';
import PremiumSubscription from '../models/PremiumSubscription.js';

// Points configuration
const LOYALTY_CONFIG = {
  purchaseRate: 10, // Points per ₹1 spent
  referrerReward: 500, // Points for referrer on first purchase
};

// Helper function to add loyalty points for order
const addLoyaltyPointsForOrder = async (userId, orderTotal, orderId) => {
  try {
    let loyalty = await LoyaltyPoint.findOne({ user: userId });
    
    if (!loyalty) {
      // Check if user was referred
      const referral = await Referral.findOne({
        'referrals.referredUser': userId,
      });
      
      const initialPoints = referral ? 200 : 100; // 200 for referred users, 100 for regular
      const bonusType = referral ? 'referral' : 'bonus';
      const bonusDesc = referral ? 'Referral signup bonus - Welcome gift!' : 'Welcome bonus for joining ShopHub!';
      
      try {
        loyalty = await LoyaltyPoint.create({
          user: userId,
          points: initialPoints,
          lifetimePoints: initialPoints,
          history: [
            {
              type: bonusType,
              points: initialPoints,
              description: bonusDesc,
            },
          ],
        });
      } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
          loyalty = await LoyaltyPoint.findOne({ user: userId });
        } else {
          throw err;
        }
      }
    }
    
    // Check for premium subscription bonus
    const premiumSubscription = await PremiumSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() },
    });
    const premiumMultiplier = premiumSubscription?.extraLoyaltyPoints || 1;
    
    // Calculate points based on tier
    const benefits = loyalty.getTierBenefits();
    const basePoints = Math.floor(orderTotal * LOYALTY_CONFIG.purchaseRate);
    const tierBonusPoints = Math.floor(basePoints * (benefits.pointsMultiplier - 1));
    const premiumBonusPoints = premiumMultiplier > 1 ? Math.floor(basePoints * (premiumMultiplier - 1)) : 0;
    const totalPoints = basePoints + tierBonusPoints + premiumBonusPoints;
    
    // Build description
    let description = `Order #${orderId.toString().slice(-8).toUpperCase()}: ${basePoints} base`;
    if (tierBonusPoints > 0) description += ` + ${tierBonusPoints} tier bonus`;
    if (premiumBonusPoints > 0) description += ` + ${premiumBonusPoints} premium bonus`;
    
    // Add points for purchase
    await loyalty.addPoints(
      totalPoints,
      'earned',
      description,
      orderId
    );
    
    // Create notification for points earned
    let notifMessage = `You earned ${totalPoints} points from your order!`;
    if (tierBonusPoints > 0 || premiumBonusPoints > 0) {
      notifMessage += ` (Includes`;
      if (tierBonusPoints > 0) notifMessage += ` ${tierBonusPoints} tier bonus`;
      if (tierBonusPoints > 0 && premiumBonusPoints > 0) notifMessage += ` +`;
      if (premiumBonusPoints > 0) notifMessage += ` ${premiumBonusPoints} premium bonus`;
      notifMessage += `!)`;
    }
    
    await Notification.create({
      user: userId,
      type: 'info',
      title: 'Loyalty Points Earned! ⭐',
      message: notifMessage,
    });
    
    return { basePoints, tierBonusPoints, premiumBonusPoints, totalPoints, newBalance: loyalty.points, tier: loyalty.tier };
  } catch (error) {
    console.error('Failed to add loyalty points:', error);
    return null;
  }
};

// Helper function to complete referral on first purchase
const completeReferralOnFirstPurchase = async (userId, orderId) => {
  try {
    // Check if this is user's first order
    const orderCount = await Order.countDocuments({ user: userId });
    if (orderCount > 1) return null; // Not first order
    
    // Find pending referral for this user
    const referral = await Referral.findOne({
      'referrals.referredUser': userId,
      'referrals.status': 'pending',
    });
    
    if (!referral) return null;
    
    // Complete the referral
    await referral.completeReferral(
      userId,
      orderId,
      LOYALTY_CONFIG.referrerReward,
      0 // Referred user already got bonus at signup
    );
    
    // Give points to referrer
    let referrerLoyalty = await LoyaltyPoint.findOne({ user: referral.referrer });
    if (!referrerLoyalty) {
      referrerLoyalty = await LoyaltyPoint.create({
        user: referral.referrer,
        points: LOYALTY_CONFIG.referrerReward,
        lifetimePoints: LOYALTY_CONFIG.referrerReward,
        history: [
          {
            type: 'referral',
            points: LOYALTY_CONFIG.referrerReward,
            description: 'Referral reward - friend made first purchase',
            referredUser: userId,
          },
        ],
      });
    } else {
      await referrerLoyalty.addPoints(
        LOYALTY_CONFIG.referrerReward,
        'referral',
        'Referral reward - friend made first purchase',
        null,
        userId
      );
    }
    
    // Notify referrer
    await Notification.create({
      user: referral.referrer,
      type: 'info',
      title: 'Referral Bonus Earned! 🎉',
      message: `Your friend made their first purchase! You earned ${LOYALTY_CONFIG.referrerReward} bonus points.`,
    });
    
    return { referrerReward: LOYALTY_CONFIG.referrerReward };
  } catch (error) {
    console.error('Failed to complete referral:', error);
    return null;
  }
};

// Helper function to notify all admins
const notifyAllAdmins = async (notification) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      user: admin._id,
      ...notification
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { 
    orderItems, 
    shippingAddress, 
    paymentInfo, 
    walletAmount = 0, 
    couponCode = null, 
    discountAmount = 0,
    premiumDiscount = 0,
    // Gift options
    giftWrap = false,
    giftWrapPrice = 0,
    giftMessage = '',
    giftRecipientName = '',
    giftRecipientEmail = '',
    sendGiftReceipt = false,
    // Delivery options
    selectedDeliveryDate = null,
    deliveryTimeSlot = '',
    deliveryInstructions = '',
    leaveAtDoor = false,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Validate and get product details
  const itemsWithDetails = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    if (!product.isActive) {
      res.status(400);
      throw new Error(`Product is not available: ${product.name}`);
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
    }

    // Use the price passed from cart (for bundle/flash sale discounts)
    // Validate that passed price is not higher than original product price
    let finalPrice = product.price;
    if (item.price !== undefined && item.price > 0 && item.price <= product.price) {
      finalPrice = item.price; // Use the discounted price from cart
    }

    itemsWithDetails.push({
      product: product._id,
      name: product.name,
      price: finalPrice,
      quantity: item.quantity,
      image: product.images[0]?.url || '/images/placeholder.jpg',
    });

    itemsPrice += finalPrice * item.quantity;
  }

  // Calculate prices
  const taxRate = 0.08; // 8% tax
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  
  // Check premium subscription for free shipping
  const premiumSubscription = await PremiumSubscription.findOne({
    user: req.user._id,
    status: 'active',
    endDate: { $gt: new Date() },
  });
  
  // Free shipping for premium members or orders over ₹100
  const shippingPrice = premiumSubscription?.freeShipping || itemsPrice > 100 ? 0 : 10;
  
  // Add gift wrap price
  const actualGiftWrapPrice = giftWrap ? Number(giftWrapPrice) || 5.99 : 0;
  
  // Apply coupon discount
  const couponDiscount = Number(discountAmount) || 0;
  
  // Apply premium discount (verify server-side)
  let actualPremiumDiscount = 0;
  if (premiumSubscription) {
    const serverCalculatedDiscount = (itemsPrice * premiumSubscription.discountPercent) / 100;
    // Use the minimum of client-sent and server-calculated to prevent manipulation
    actualPremiumDiscount = Math.min(Number(premiumDiscount) || 0, serverCalculatedDiscount);
    actualPremiumDiscount = Number(actualPremiumDiscount.toFixed(2));
  }
  
  let totalPrice = Number((itemsPrice + taxPrice + shippingPrice + actualGiftWrapPrice - couponDiscount - actualPremiumDiscount).toFixed(2));
  totalPrice = Math.max(0, totalPrice); // Ensure non-negative
  
  // Handle wallet payment
  let walletUsed = 0;
  if (walletAmount > 0) {
    const user = await User.findById(req.user._id);
    const availableBalance = user.walletBalance || 0;
    
    // Use minimum of requested amount, available balance, or total price
    walletUsed = Math.min(walletAmount, availableBalance, totalPrice);
    
    if (walletUsed > 0) {
      // Deduct from wallet
      user.walletBalance = availableBalance - walletUsed;
      
      // Initialize walletHistory if it doesn't exist
      if (!user.walletHistory) {
        user.walletHistory = [];
      }
      
      user.walletHistory.push({
        type: 'debit',
        amount: walletUsed,
        description: 'Used for order payment',
      });
      await user.save();
      
      // Reduce total price
      totalPrice = Number((totalPrice - walletUsed).toFixed(2));
    }
  }

  // Determine payment status
  let paymentStatus = 'unpaid';
  if (totalPrice === 0) {
    paymentStatus = 'paid'; // Fully paid by wallet
  } else if (paymentInfo.status === 'paid') {
    paymentStatus = 'paid'; // Already paid (e.g., Razorpay)
  }

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems: itemsWithDetails,
    shippingAddress,
    paymentInfo: {
      method: paymentInfo.method,
      status: paymentStatus,
      transactionId: paymentInfo.transactionId || null,
      razorpayOrderId: paymentInfo.razorpayOrderId || null,
      paidAt: paymentStatus === 'paid' ? new Date() : null,
    },
    itemsPrice,
    taxPrice,
    shippingPrice,
    couponCode,
    discountAmount,
    premiumDiscount: actualPremiumDiscount,
    walletAmount: walletUsed,
    totalPrice,
    status: paymentStatus === 'paid' ? 'Confirmed' : 'Pending',
    // Gift options
    giftWrap: {
      enabled: giftWrap,
      price: actualGiftWrapPrice,
      message: giftMessage,
      recipientName: giftRecipientName,
      recipientEmail: giftRecipientEmail,
      sendGiftReceipt: sendGiftReceipt,
    },
    // Delivery options
    selectedDeliveryDate: selectedDeliveryDate ? new Date(selectedDeliveryDate) : null,
    deliveryTimeSlot,
    deliveryInstructions,
    leaveAtDoor,
  });
  
  // Update wallet history with order ID
  if (walletUsed > 0) {
    const user = await User.findById(req.user._id);
    const lastEntry = user.walletHistory[user.walletHistory.length - 1];
    if (lastEntry) {
      lastEntry.orderId = order._id;
      lastEntry.description = `Used for order #${order._id.toString().slice(-8).toUpperCase()}`;
      await user.save();
    }
  }

  // Decrease stock for each product
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Send response immediately
  res.status(201).json({
    success: true,
    data: order,
    walletUsed: walletUsed > 0 ? { amount: walletUsed } : null,
  });

  // Process these in background (don't await)
  // Add loyalty points for this order
  addLoyaltyPointsForOrder(req.user._id, itemsPrice, order._id)
    .then((loyaltyResult) => {
      if (loyaltyResult) {
        console.log(`Loyalty points added for order ${order._id}`);
      }
    })
    .catch((err) => console.error('Loyalty points error:', err));
  
  // Complete referral if this is user's first purchase
  completeReferralOnFirstPurchase(req.user._id, order._id)
    .catch((err) => console.error('Referral completion error:', err));

  // Send order confirmation email in background
  const emailContent = emailTemplates.orderConfirmation(order, req.user);
  sendEmail({
    to: req.user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  }).catch((emailError) => {
    console.error('Failed to send order confirmation email:', emailError);
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json({
      success: true,
      data: order,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const count = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    order.paymentInfo.status = 'paid';
    order.paymentInfo.paidAt = Date.now();
    order.paymentInfo.transactionId = req.body.transactionId || `TXN-${Date.now()}`;
    order.status = 'Paid';

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = {};

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    query['paymentInfo.status'] = req.query.paymentStatus;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Run count and orders query in parallel for faster loading
  const [count, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .select('_id orderNumber user orderItems totalPrice status paymentInfo createdAt')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const { status, trackingNumber } = req.body;

    if (!['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    // Handle cancellation - restore stock (run in background for non-blocking)
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      // Fire and forget - don't await
      Promise.all(
        order.orderItems.map(item =>
          Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
        )
      ).catch(err => console.error('Failed to restore stock:', err));
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    if (status === 'Confirmed' && order.paymentInfo.status !== 'paid') {
      order.paymentInfo.status = 'paid';
      order.paymentInfo.paidAt = Date.now();
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    const updatedOrder = await order.save();

    // Send response immediately - don't wait for notifications/emails
    res.json({
      success: true,
      data: updatedOrder,
    });

    // Run notification and email in background (fire and forget)
    if (status !== previousStatus) {
      // Background: Create notification
      notifyOrderStatus(order.user._id, order, status).catch(err => 
        console.error('Failed to send notification:', err)
      );

      // Background: Send emails
      if (status === 'Shipped' && previousStatus !== 'Shipped') {
        const emailContent = emailTemplates.orderShipped(order, order.user, trackingNumber);
        sendEmail({
          to: order.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).catch(err => console.error('Failed to send shipped email:', err));
      } else if (status === 'Delivered' && previousStatus !== 'Delivered') {
        const emailContent = emailTemplates.orderDelivered(order, order.user);
        sendEmail({
          to: order.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        }).catch(err => console.error('Failed to send delivered email:', err));
      }
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get order statistics (admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
  // Define current period (last 30 days) and previous period (30-60 days ago)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Orders by status (all time)
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$totalPrice' },
      },
    },
  ]);

  // Calculate total orders and revenue (all time)
  const totalOrders = ordersByStatus.reduce((sum, item) => sum + item.count, 0);
  const totalRevenue = ordersByStatus.reduce((sum, item) => sum + item.total, 0);

  // Current period stats (last 30 days)
  const currentPeriodOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  // Previous period stats (30-60 days ago)
  const previousPeriodOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
  ]);

  const currentOrders = currentPeriodOrders[0]?.count || 0;
  const previousOrders = previousPeriodOrders[0]?.count || 0;
  const currentRevenue = currentPeriodOrders[0]?.revenue || 0;
  const previousRevenue = previousPeriodOrders[0]?.revenue || 0;

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const ordersChange = calculateChange(currentOrders, previousOrders);
  const revenueChange = calculateChange(currentRevenue, previousRevenue);

  // Get total products count and compare
  const totalProducts = await Product.countDocuments({ isActive: true });
  const productsThirtyDaysAgo = await Product.countDocuments({
    isActive: true,
    createdAt: { $lt: thirtyDaysAgo }
  });
  const newProducts = totalProducts - productsThirtyDaysAgo;
  const productsChange = productsThirtyDaysAgo > 0 
    ? ((newProducts) / productsThirtyDaysAgo) * 100 
    : (newProducts > 0 ? 100 : 0);

  // Get total users count and compare
  const User = (await import('../models/User.js')).default;
  const totalUsers = await User.countDocuments();
  const usersThirtyDaysAgo = await User.countDocuments({
    createdAt: { $lt: thirtyDaysAgo }
  });
  const newUsers = totalUsers - usersThirtyDaysAgo;
  const usersChange = usersThirtyDaysAgo > 0 
    ? ((newUsers) / usersThirtyDaysAgo) * 100 
    : (newUsers > 0 ? 100 : 0);

  // Orders by month (last 12 months)
  const ordersByMonth = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  // Top selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalSold: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  // Convert ordersByStatus array to object for easier access
  const statusCounts = {};
  ordersByStatus.forEach(item => {
    statusCounts[item._id] = item.count;
  });

  res.json({
    success: true,
    data: {
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      // Percentage changes (comparing last 30 days vs previous 30 days)
      ordersChange: Math.round(ordersChange * 10) / 10,
      revenueChange: Math.round(revenueChange * 10) / 10,
      productsChange: Math.round(productsChange * 10) / 10,
      usersChange: Math.round(usersChange * 10) / 10,
      ordersByStatus: statusCounts,
      ordersByMonth,
      recentOrders,
      topProducts,
    },
  });
});

// @desc    Cancel order (user)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['Pending', 'Paid', 'Processing'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}. Order can only be cancelled when Pending, Paid, or Processing.`);
  }

  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error('Please provide a reason for cancellation (minimum 10 characters)');
  }

  // Restore stock for each item
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  // Update order status
  order.status = 'Cancelled';
  order.cancellation = {
    reason: reason.trim(),
    cancelledAt: new Date(),
    cancelledBy: req.user._id,
    refundAmount: order.totalPrice,
    refundStatus: order.paymentInfo.status === 'paid' ? 'pending' : 'not_applicable',
  };

  // Add to status history
  order.statusHistory.push({
    status: 'Cancelled',
    note: `Cancelled by ${req.user.role === 'admin' ? 'admin' : 'customer'}: ${reason}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

// @desc    Request return for order
// @route   POST /api/orders/:id/return
// @access  Private
export const requestReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to request return for this order');
  }

  // Check if order is delivered
  if (order.status !== 'Delivered') {
    res.status(400);
    throw new Error('Only delivered orders can be returned');
  }

  // Check if already has a return request
  if (order.returnRequest && order.returnRequest.status) {
    res.status(400);
    throw new Error(`Return request already exists with status: ${order.returnRequest.status}`);
  }

  // Check return window (30 days from delivery)
  const deliveryDate = new Date(order.deliveredAt);
  const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  if (Date.now() - deliveryDate.getTime() > returnWindow) {
    res.status(400);
    throw new Error('Return window has expired. Returns must be requested within 30 days of delivery.');
  }

  const { reason, items } = req.body;

  if (!reason || reason.trim().length < 20) {
    res.status(400);
    throw new Error('Please provide a detailed reason for return (minimum 20 characters)');
  }

  // Calculate refund amount (can be partial if specific items are returned)
  let refundAmount = order.totalPrice;
  let returnItems = order.orderItems;

  if (items && items.length > 0) {
    // Partial return
    returnItems = [];
    refundAmount = 0;

    for (const returnItem of items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.product.toString() === returnItem.productId
      );

      if (!orderItem) {
        res.status(400);
        throw new Error(`Product ${returnItem.productId} not found in order`);
      }

      if (returnItem.quantity > orderItem.quantity) {
        res.status(400);
        throw new Error(`Cannot return more than ordered quantity for ${orderItem.name}`);
      }

      returnItems.push({
        product: orderItem.product,
        name: orderItem.name,
        quantity: returnItem.quantity,
        price: orderItem.price,
      });

      refundAmount += orderItem.price * returnItem.quantity;
    }
  }

  order.returnRequest = {
    status: 'requested',
    reason: reason.trim(),
    requestedAt: new Date(),
    items: returnItems,
    refundAmount,
  };

  // Add to status history
  order.statusHistory.push({
    status: 'Return Requested',
    note: `Return requested by customer: ${reason}`,
    updatedBy: req.user._id,
  });

  await order.save();

  // Notify all admins about the return request
  await notifyAllAdmins({
    type: 'return_request',
    title: 'New Return Request',
    message: `Return request received for Order #${order._id.toString().slice(-8).toUpperCase()}. Customer: ${req.user.name}. Reason: ${reason.trim().substring(0, 100)}${reason.length > 100 ? '...' : ''}`,
    link: `/admin/orders/${order._id}`,
    data: {
      orderId: order._id,
      refundAmount,
      customerName: req.user.name,
      customerEmail: req.user.email,
    }
  });

  res.json({
    success: true,
    message: 'Return request submitted successfully',
    data: order,
  });
});

// @desc    Process return request (admin)
// @route   PUT /api/orders/:id/return/process
// @access  Private/Admin
export const processReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.returnRequest || !order.returnRequest.status) {
    res.status(400);
    throw new Error('No return request found for this order');
  }

  if (order.returnRequest.status !== 'requested') {
    res.status(400);
    throw new Error(`Cannot process return with status: ${order.returnRequest.status}`);
  }

  const { action, adminNote, refundAmount } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Action must be either "approve" or "reject"');
  }

  if (action === 'approve') {
    // Restore stock for returned items
    const returnItems = order.returnRequest.items || order.orderItems;
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.returnRequest.status = 'approved';
    order.returnRequest.refundAmount = refundAmount || order.returnRequest.refundAmount;
    order.returnRequest.refundStatus = 'pending';
    order.status = 'Returned';

    order.statusHistory.push({
      status: 'Return Approved',
      note: adminNote || 'Return request approved by admin',
      updatedBy: req.user._id,
    });
  } else {
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectionReason = adminNote || 'Return request rejected';

    order.statusHistory.push({
      status: 'Return Rejected',
      note: adminNote || 'Return request rejected by admin',
      updatedBy: req.user._id,
    });
  }

  order.returnRequest.processedAt = new Date();
  order.returnRequest.processedBy = req.user._id;

  await order.save();

  res.json({
    success: true,
    message: `Return request ${action}d successfully`,
    data: order,
  });
});

// @desc    Update tracking info (admin)
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
export const updateTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const { carrier, trackingNumber, trackingUrl, estimatedDelivery } = req.body;

  if (carrier) order.carrier = carrier;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  // If tracking number is added and order is paid, update to shipped
  if (trackingNumber && order.status === 'Paid') {
    order.status = 'Shipped';
    order.shippedAt = new Date();

    order.statusHistory.push({
      status: 'Shipped',
      note: `Order shipped via ${carrier}. Tracking: ${trackingNumber}`,
      updatedBy: req.user._id,
    });
  }

  await order.save();

  res.json({
    success: true,
    message: 'Tracking information updated',
    data: order,
  });
});

// @desc    Get orders with return requests (admin)
// @route   GET /api/orders/returns
// @access  Private/Admin
export const getReturnRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    'returnRequest.status': { $exists: true },
  };

  // Filter by return status
  if (req.query.status) {
    query['returnRequest.status'] = req.query.status;
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('returnRequest.processedBy', 'name')
    .sort({ 'returnRequest.requestedAt': -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Process refund (admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
export const processRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }


  // Check if order is cancelled or returned
  if (!['Cancelled', 'Returned'].includes(order.status)) {
    res.status(400);
    throw new Error('Only cancelled or returned orders can be refunded');
  }

  // Determine which refund to process
  let refundData;
  if (order.status === 'Cancelled' && order.cancellation) {
    refundData = order.cancellation;
  } else if (order.status === 'Returned' && order.returnRequest) {
    refundData = order.returnRequest;
  } else {
    res.status(400);
    throw new Error('No refund information found');
  }

  if (refundData.refundStatus === 'completed') {
    res.status(400);
    throw new Error('Refund has already been processed');
  }

  const { refundMethod, transactionId, note } = req.body;

  refundData.refundStatus = 'completed';
  refundData.refundedAt = new Date();
  refundData.refundMethod = refundMethod || 'original_payment_method';
  refundData.refundTransactionId = transactionId;

  order.statusHistory.push({
    status: 'Refunded',
    note: note || `Refund of ₹${refundData.refundAmount} processed via ${refundMethod || 'original payment method'}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: order,
  });
});

// @desc    Get Buy Again items (products from past orders)
// @route   GET /api/orders/buy-again
// @access  Private
export const getBuyAgainItems = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // Get all delivered orders for this user
  const orders = await Order.find({
    user: req.user._id,
    status: 'Delivered',
  })
    .sort({ deliveredAt: -1 })
    .select('orderItems deliveredAt');

  // Extract unique products with their latest purchase info
  const productMap = new Map();

  for (const order of orders) {
    for (const item of order.orderItems) {
      if (!productMap.has(item.product.toString())) {
        productMap.set(item.product.toString(), {
          productId: item.product,
          name: item.name,
          image: item.image,
          lastPurchasePrice: item.price,
          lastPurchaseDate: order.deliveredAt,
          purchaseCount: 1,
        });
      } else {
        const existing = productMap.get(item.product.toString());
        existing.purchaseCount += 1;
      }
    }
  }

  // Get current product details
  const productIds = Array.from(productMap.keys());
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).select('name price images stock rating numReviews');

  // Combine with purchase history
  const buyAgainItems = products.map((product) => {
    const history = productMap.get(product._id.toString());
    return {
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        stock: product.stock,
        rating: product.rating,
        numReviews: product.numReviews,
      },
      lastPurchasePrice: history?.lastPurchasePrice,
      lastPurchaseDate: history?.lastPurchaseDate,
      purchaseCount: history?.purchaseCount || 1,
      priceChanged: history?.lastPurchasePrice !== product.price,
    };
  });

  // Sort by purchase count (most bought first)
  buyAgainItems.sort((a, b) => b.purchaseCount - a.purchaseCount);

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedItems = buyAgainItems.slice(startIndex, endIndex);

  res.json({
    success: true,
    count: buyAgainItems.length,
    page: parseInt(page),
    pages: Math.ceil(buyAgainItems.length / limit),
    data: paginatedItems,
  });
});

// @desc    Reorder - Add all items from a previous order to cart
// @route   POST /api/orders/:id/reorder
// @access  Private
export const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('orderItems.product');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Check product availability
  const cartItems = [];
  const unavailableItems = [];

  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    
    if (!product || !product.isActive) {
      unavailableItems.push({
        name: item.name,
        reason: 'Product no longer available',
      });
      continue;
    }

    if (product.stock < 1) {
      unavailableItems.push({
        name: item.name,
        reason: 'Out of stock',
      });
      continue;
    }

    const availableQty = Math.min(item.quantity, product.stock);
    
    cartItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
      quantity: availableQty,
      stock: product.stock,
      originalQuantity: item.quantity,
      quantityAdjusted: availableQty < item.quantity,
    });
  }

  res.json({
    success: true,
    data: {
      cartItems,
      unavailableItems,
      message: unavailableItems.length > 0 
        ? 'Some items are no longer available or have limited stock'
        : 'All items added to cart',
    },
  });
});

// @desc    Download order invoice as PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this invoice');
  }

  try {
    const pdfBuffer = await generateInvoicePDF(order, order.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500);
    throw new Error('Failed to generate invoice PDF');
  }
});
