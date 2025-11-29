import PremiumSubscription from '../models/PremiumSubscription.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Revenue from '../models/Revenue.js';
import asyncHandler from 'express-async-handler';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';

// Initialize Razorpay
console.log('Initializing Razorpay with key:', config.razorpayKeyId ? 'Present' : 'Missing');
let razorpay = null;
try {
  if (config.razorpayKeyId && config.razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
    console.log('Razorpay initialized successfully');
  } else {
    console.error('Razorpay keys not found in config');
  }
} catch (err) {
  console.error('Failed to initialize Razorpay:', err);
}

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

// @desc    Create Razorpay order for premium subscription
// @route   POST /api/premium/create-order
// @access  Private
export const createPremiumOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  console.log('Creating premium order for plan:', plan);

  if (!plan || !PREMIUM_PLANS[plan]) {
    res.status(400);
    throw new Error('Invalid plan selected');
  }

  if (!razorpay) {
    console.error('Razorpay not configured. Key ID:', config.razorpayKeyId ? 'present' : 'missing');
    res.status(500);
    throw new Error('Payment system not configured');
  }

  const planDetails = PREMIUM_PLANS[plan];

  // Check if user already has an active subscription
  const existingSubscription = await PremiumSubscription.findOne({ user: req.user._id });
  
  if (existingSubscription && existingSubscription.isActive()) {
    res.status(400);
    throw new Error('You already have an active premium subscription');
  }

  // Create Razorpay order - receipt must be <= 40 chars
  const shortUserId = req.user._id.toString().slice(-8);
  const options = {
    amount: Math.round(planDetails.price * 100), // Convert to paise
    currency: 'INR',
    receipt: `prem_${shortUserId}_${Date.now().toString().slice(-10)}`,
    notes: {
      userId: req.user._id.toString(),
      plan: plan,
      planName: planDetails.name,
    },
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);
    console.log('Razorpay order created:', razorpayOrder.id);

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: config.razorpayKeyId,
      plan: planDetails,
    });
  } catch (razorpayError) {
    console.error('Razorpay order creation failed:', razorpayError);
    console.error('Error details:', JSON.stringify(razorpayError, null, 2));
    res.status(500);
    throw new Error('Failed to create payment order: ' + (razorpayError.error?.description || razorpayError.message || 'Unknown error'));
  }
});

// @desc    Verify payment and activate premium subscription
// @route   POST /api/premium/verify-payment
// @access  Private
export const verifyPremiumPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification data');
  }

  if (!plan || !PREMIUM_PLANS[plan]) {
    res.status(400);
    throw new Error('Invalid plan');
  }

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(body.toString())
    .digest('hex');

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    res.status(400);
    throw new Error('Payment verification failed - Invalid signature');
  }

  const planDetails = PREMIUM_PLANS[plan];
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + planDetails.duration * 24 * 60 * 60 * 1000);
  const nextBillingDate = new Date(endDate);

  let subscription;
  const existingSubscription = await PremiumSubscription.findOne({ user: req.user._id });

  if (existingSubscription) {
    // Reactivate/Update existing subscription
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
    existingSubscription.lastPaymentDate = new Date();
    existingSubscription.paymentMethod = 'razorpay';
    existingSubscription.paymentHistory.push({
      amount: planDetails.price,
      date: new Date(),
      status: 'success',
      transactionId: razorpay_payment_id,
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
      paymentMethod: 'razorpay',
      autoRenew: true,
      lastPaymentDate: new Date(),
      paymentHistory: [
        {
          amount: planDetails.price,
          date: new Date(),
          status: 'success',
          transactionId: razorpay_payment_id,
        },
      ],
    });
  }

  // Update user's premium status
  await User.findByIdAndUpdate(req.user._id, { isPremium: true });

  // Record revenue
  await Revenue.recordSubscriptionPayment(subscription, {
    method: 'razorpay',
    transactionId: razorpay_payment_id,
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

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

  res.json({
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

// @desc    Subscribe to premium (legacy - now just returns payment info)
// @route   POST /api/premium/subscribe
// @access  Private
export const subscribeToPremium = asyncHandler(async (req, res) => {
  const { plan } = req.body;

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

  // Return plan info for frontend to initiate payment
  res.json({
    success: true,
    message: 'Please complete payment to activate subscription',
    plan: planDetails,
    requiresPayment: true,
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
