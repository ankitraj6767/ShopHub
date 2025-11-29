import PremiumSubscription from '../models/PremiumSubscription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import asyncHandler from 'express-async-handler';

// Premium plan configuration
const PREMIUM_PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Premium',
    price: 99,
    duration: 30, // days
    discountPercent: 10,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: true,
    extraLoyaltyPoints: 2,
    description: 'Perfect for trying out Premium benefits',
    features: [
      '10% discount on all products',
      'Free shipping on all orders',
      'Priority customer support',
      'Early access to flash sales',
      '2x loyalty points on purchases',
    ],
  },
  yearly: {
    id: 'yearly',
    name: 'Yearly Premium',
    price: 799,
    duration: 365, // days
    discountPercent: 15,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: true,
    extraLoyaltyPoints: 3,
    description: 'Best value - Save ₹389 compared to monthly',
    features: [
      '15% discount on all products',
      'Free shipping on all orders',
      'Priority customer support',
      'Early access to flash sales',
      '3x loyalty points on purchases',
      'Exclusive yearly member deals',
    ],
    savings: 389,
  },
};

// @desc    Get premium plans
// @route   GET /api/premium/plans
// @access  Public
export const getPremiumPlans = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    plans: Object.values(PREMIUM_PLANS),
  });
});

// @desc    Get user's premium subscription status
// @route   GET /api/premium/status
// @access  Private
export const getPremiumStatus = asyncHandler(async (req, res) => {
  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.json({
      success: true,
      isPremium: false,
      subscription: null,
    });
  }

  const isActive = subscription.isActive();
  const daysRemaining = subscription.getDaysRemaining();

  res.json({
    success: true,
    isPremium: isActive,
    subscription: {
      _id: subscription._id,
      plan: subscription.plan,
      planName: subscription.planName,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      discountPercent: subscription.discountPercent,
      freeShipping: subscription.freeShipping,
      prioritySupport: subscription.prioritySupport,
      earlyAccess: subscription.earlyAccess,
      extraLoyaltyPoints: subscription.extraLoyaltyPoints,
      autoRenew: subscription.autoRenew,
      daysRemaining,
      nextBillingDate: subscription.nextBillingDate,
    },
  });
});

// @desc    Subscribe to premium
// @route   POST /api/premium/subscribe
// @access  Private
export const subscribeToPremium = asyncHandler(async (req, res) => {
  const { plan, paymentMethod = 'card' } = req.body;

  if (!plan || !PREMIUM_PLANS[plan]) {
    res.status(400);
    throw new Error('Invalid plan selected');
  }

  const planDetails = PREMIUM_PLANS[plan];

  // Check if user already has an active subscription
  const existingSubscription = await PremiumSubscription.findOne({ user: req.user._id });
  
  if (existingSubscription && existingSubscription.isActive()) {
    res.status(400);
    throw new Error('You already have an active premium subscription');
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + planDetails.duration * 24 * 60 * 60 * 1000);
  const nextBillingDate = new Date(endDate);

  let subscription;

  if (existingSubscription) {
    // Reactivate existing subscription
    existingSubscription.plan = plan;
    existingSubscription.planName = planDetails.name;
    existingSubscription.price = planDetails.price;
    existingSubscription.discountPercent = planDetails.discountPercent;
    existingSubscription.freeShipping = planDetails.freeShipping;
    existingSubscription.prioritySupport = planDetails.prioritySupport;
    existingSubscription.earlyAccess = planDetails.earlyAccess;
    existingSubscription.extraLoyaltyPoints = planDetails.extraLoyaltyPoints;
    existingSubscription.status = 'active';
    existingSubscription.startDate = startDate;
    existingSubscription.endDate = endDate;
    existingSubscription.nextBillingDate = nextBillingDate;
    existingSubscription.autoRenew = true;
    existingSubscription.cancelledAt = undefined;
    existingSubscription.paymentHistory.push({
      amount: planDetails.price,
      date: new Date(),
      status: 'success',
      transactionId: `TXN_${Date.now()}`,
    });
    subscription = await existingSubscription.save();
  } else {
    // Create new subscription
    subscription = await PremiumSubscription.create({
      user: req.user._id,
      plan,
      planName: planDetails.name,
      price: planDetails.price,
      discountPercent: planDetails.discountPercent,
      freeShipping: planDetails.freeShipping,
      prioritySupport: planDetails.prioritySupport,
      earlyAccess: planDetails.earlyAccess,
      extraLoyaltyPoints: planDetails.extraLoyaltyPoints,
      status: 'active',
      startDate,
      endDate,
      nextBillingDate,
      paymentMethod,
      autoRenew: true,
      lastPaymentDate: new Date(),
      paymentHistory: [
        {
          amount: planDetails.price,
          date: new Date(),
          status: 'success',
          transactionId: `TXN_${Date.now()}`,
        },
      ],
    });
  }

  // Update user's premium status
  await User.findByIdAndUpdate(req.user._id, { isPremium: true });

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'subscription',
    title: 'Welcome to ShopHub Premium! 🎉',
    message: `You're now a ${planDetails.name} member. Enjoy ${planDetails.discountPercent}% off on all products!`,
    data: {
      subscriptionId: subscription._id,
    },
  });

  res.status(201).json({
    success: true,
    message: `Successfully subscribed to ${planDetails.name}!`,
    subscription: {
      _id: subscription._id,
      plan: subscription.plan,
      planName: subscription.planName,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      discountPercent: subscription.discountPercent,
      daysRemaining: subscription.getDaysRemaining(),
    },
  });
});

// @desc    Cancel premium subscription
// @route   POST /api/premium/cancel
// @access  Private
export const cancelPremium = asyncHandler(async (req, res) => {
  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No subscription found');
  }

  if (subscription.status === 'cancelled') {
    res.status(400);
    throw new Error('Subscription is already cancelled');
  }

  // Don't immediately cancel - let them use until end date
  subscription.status = 'cancelled';
  subscription.autoRenew = false;
  subscription.cancelledAt = new Date();
  await subscription.save();

  // Create notification
  await Notification.create({
    user: req.user._id,
    type: 'subscription',
    title: 'Premium Subscription Cancelled',
    message: `Your premium subscription has been cancelled. You can still enjoy premium benefits until ${subscription.endDate.toLocaleDateString()}.`,
    data: {
      subscriptionId: subscription._id,
    },
  });

  res.json({
    success: true,
    message: `Subscription cancelled. You can enjoy premium benefits until ${subscription.endDate.toLocaleDateString()}`,
    subscription: {
      status: subscription.status,
      endDate: subscription.endDate,
    },
  });
});

// @desc    Toggle auto-renewal
// @route   PUT /api/premium/auto-renew
// @access  Private
export const toggleAutoRenew = asyncHandler(async (req, res) => {
  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    res.status(404);
    throw new Error('No subscription found');
  }

  subscription.autoRenew = !subscription.autoRenew;
  await subscription.save();

  res.json({
    success: true,
    message: `Auto-renewal ${subscription.autoRenew ? 'enabled' : 'disabled'}`,
    autoRenew: subscription.autoRenew,
  });
});

// @desc    Get premium benefits (for displaying on products)
// @route   GET /api/premium/benefits
// @access  Private
export const getPremiumBenefits = asyncHandler(async (req, res) => {
  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription || !subscription.isActive()) {
    return res.json({
      success: true,
      isPremium: false,
      benefits: null,
    });
  }

  res.json({
    success: true,
    isPremium: true,
    benefits: {
      discountPercent: subscription.discountPercent,
      freeShipping: subscription.freeShipping,
      prioritySupport: subscription.prioritySupport,
      earlyAccess: subscription.earlyAccess,
      extraLoyaltyPoints: subscription.extraLoyaltyPoints,
    },
  });
});

// @desc    Get subscription history
// @route   GET /api/premium/history
// @access  Private
export const getSubscriptionHistory = asyncHandler(async (req, res) => {
  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.json({
      success: true,
      history: [],
    });
  }

  res.json({
    success: true,
    history: subscription.paymentHistory,
  });
});

// @desc    Check if user is premium (for middleware use)
// @route   GET /api/premium/check/:userId
// @access  Private/Admin
export const checkUserPremium = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const isPremium = await PremiumSubscription.hasActivePremium(userId);
  
  res.json({
    success: true,
    isPremium,
  });
});

// @desc    Calculate discounted price for premium user
// @route   POST /api/premium/calculate-discount
// @access  Private
export const calculateDiscount = asyncHandler(async (req, res) => {
  const { originalPrice } = req.body;

  if (!originalPrice || originalPrice <= 0) {
    res.status(400);
    throw new Error('Invalid price');
  }

  const subscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (!subscription || !subscription.isActive()) {
    return res.json({
      success: true,
      isPremium: false,
      originalPrice,
      discountedPrice: originalPrice,
      savings: 0,
      discountPercent: 0,
    });
  }

  const discountAmount = (originalPrice * subscription.discountPercent) / 100;
  const discountedPrice = originalPrice - discountAmount;

  res.json({
    success: true,
    isPremium: true,
    originalPrice,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    savings: Math.round(discountAmount * 100) / 100,
    discountPercent: subscription.discountPercent,
  });
});
