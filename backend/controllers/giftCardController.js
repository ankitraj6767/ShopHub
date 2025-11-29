import asyncHandler from 'express-async-handler';
import GiftCard from '../models/GiftCard.js';
import User from '../models/User.js';
import Revenue from '../models/Revenue.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import config from '../config/config.js';

// Initialize Razorpay
let razorpay = null;
try {
  if (config.razorpayKeyId && config.razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }
} catch (err) {
  console.error('Failed to initialize Razorpay for gift cards:', err);
}

// @desc    Create Razorpay order for gift card purchase
// @route   POST /api/gift-cards/create-order
// @access  Private
export const createGiftCardOrder = asyncHandler(async (req, res) => {
  const { amount, recipientEmail, recipientName, senderName, message, theme } = req.body;

  if (amount < 500 || amount > 50000) {
    res.status(400);
    throw new Error('Gift card amount must be between ₹500 and ₹50,000');
  }

  if (!recipientEmail) {
    res.status(400);
    throw new Error('Recipient email is required');
  }

  if (!razorpay) {
    res.status(500);
    throw new Error('Payment system not configured');
  }

  // Create Razorpay order
  const shortUserId = req.user._id.toString().slice(-8);
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: `gc_${shortUserId}_${Date.now().toString().slice(-10)}`,
    notes: {
      userId: req.user._id.toString(),
      type: 'gift_card',
      recipientEmail,
      recipientName: recipientName || '',
      senderName: senderName || req.user.name,
      message: message || '',
      theme: theme || 'general',
    },
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: config.razorpayKeyId,
      giftCardDetails: {
        amount,
        recipientEmail,
        recipientName,
        senderName: senderName || req.user.name,
        message,
        theme,
      },
    });
  } catch (error) {
    console.error('Razorpay gift card order creation failed:', error);
    res.status(500);
    throw new Error('Failed to create payment order: ' + (error.error?.description || error.message || 'Unknown error'));
  }
});

// @desc    Verify payment and create gift card
// @route   POST /api/gift-cards/verify-payment
// @access  Private
export const verifyGiftCardPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    recipientEmail,
    recipientName,
    senderName,
    message,
    theme,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment verification data');
  }

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed - Invalid signature');
  }

  // Create the gift card
  const code = GiftCard.generateCode();
  
  // Set expiry to 1 year from now
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const giftCard = await GiftCard.create({
    code,
    initialBalance: amount,
    currentBalance: amount,
    purchasedBy: req.user._id,
    recipientEmail,
    recipientName,
    senderName: senderName || req.user.name,
    message,
    theme: theme || 'general',
    expiryDate,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    transactions: [
      {
        type: 'purchase',
        amount,
        user: req.user._id,
      },
    ],
  });

  // Record revenue
  try {
    await Revenue.create({
      type: 'gift_card',
      amount: amount,
      sourceId: giftCard._id,
      sourceModel: 'GiftCard',
      user: req.user._id,
      paymentMethod: 'razorpay',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      description: `Gift Card Purchase - ${code}`,
      status: 'completed',
    });
  } catch (revenueError) {
    console.error('Failed to record gift card revenue:', revenueError);
  }

  // TODO: Send email to recipient with gift card details

  res.status(201).json({
    success: true,
    message: 'Gift card purchased successfully!',
    data: giftCard,
  });
});

// @desc    Purchase a gift card (legacy - without payment)
// @route   POST /api/gift-cards
// @access  Private
export const purchaseGiftCard = asyncHandler(async (req, res) => {
  const { amount, recipientEmail, recipientName, senderName, message, theme } = req.body;

  if (amount < 500 || amount > 50000) {
    res.status(400);
    throw new Error('Gift card amount must be between ₹500 and ₹50,000');
  }

  // Redirect to payment flow
  res.status(400);
  throw new Error('Please use the payment flow to purchase gift cards');
});

// @desc    Get user's purchased gift cards
// @route   GET /api/gift-cards/purchased
// @access  Private
export const getPurchasedGiftCards = asyncHandler(async (req, res) => {
  const giftCards = await GiftCard.find({ purchasedBy: req.user._id })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: giftCards,
  });
});

// @desc    Get user's redeemed gift cards
// @route   GET /api/gift-cards/redeemed
// @access  Private
export const getRedeemedGiftCards = asyncHandler(async (req, res) => {
  const giftCards = await GiftCard.find({ 
    redeemedBy: req.user._id,
    currentBalance: { $gt: 0 },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: giftCards,
  });
});

// @desc    Check gift card balance
// @route   GET /api/gift-cards/check/:code
// @access  Public
export const checkGiftCardBalance = asyncHandler(async (req, res) => {
  const giftCard = await GiftCard.findOne({ code: req.params.code.toUpperCase() });

  if (!giftCard) {
    res.status(404);
    throw new Error('Gift card not found');
  }

  const isExpired = giftCard.expiryDate && new Date() > giftCard.expiryDate;

  res.json({
    success: true,
    data: {
      code: giftCard.code,
      currentBalance: giftCard.currentBalance,
      initialBalance: giftCard.initialBalance,
      isActive: giftCard.isActive,
      isExpired,
      expiryDate: giftCard.expiryDate,
      isValid: giftCard.isValid(),
    },
  });
});

// @desc    Redeem gift card to account
// @route   POST /api/gift-cards/redeem
// @access  Private
export const redeemGiftCard = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const giftCard = await GiftCard.findOne({ code: code.toUpperCase() });

  if (!giftCard) {
    res.status(404);
    throw new Error('Gift card not found');
  }

  if (!giftCard.isValid()) {
    res.status(400);
    throw new Error('Gift card is not valid or has expired');
  }

  if (giftCard.redeemedBy && giftCard.redeemedBy.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error('This gift card has already been redeemed by another user');
  }

  giftCard.redeemedBy = req.user._id;
  await giftCard.save();

  res.json({
    success: true,
    message: 'Gift card added to your account',
    data: {
      code: giftCard.code,
      balance: giftCard.currentBalance,
    },
  });
});

// @desc    Apply gift card to order
// @route   POST /api/gift-cards/apply
// @access  Private
export const applyGiftCard = asyncHandler(async (req, res) => {
  const { code, amount, orderId } = req.body;

  const giftCard = await GiftCard.findOne({ code: code.toUpperCase() });

  if (!giftCard) {
    res.status(404);
    throw new Error('Gift card not found');
  }

  if (!giftCard.isValid()) {
    res.status(400);
    throw new Error('Gift card is not valid or has expired');
  }

  if (amount > giftCard.currentBalance) {
    res.status(400);
    throw new Error(`Insufficient balance. Available: $${giftCard.currentBalance.toFixed(2)}`);
  }

  await giftCard.use(amount, orderId, req.user._id);

  res.json({
    success: true,
    data: {
      amountApplied: amount,
      remainingBalance: giftCard.currentBalance,
    },
  });
});

// @desc    Get gift card by code (admin)
// @route   GET /api/gift-cards/admin/:code
// @access  Private/Admin
export const getGiftCardByCode = asyncHandler(async (req, res) => {
  const giftCard = await GiftCard.findOne({ code: req.params.code.toUpperCase() })
    .populate('purchasedBy', 'name email')
    .populate('redeemedBy', 'name email');

  if (!giftCard) {
    res.status(404);
    throw new Error('Gift card not found');
  }

  res.json({
    success: true,
    data: giftCard,
  });
});

// @desc    Deactivate gift card (admin)
// @route   PUT /api/gift-cards/admin/:id/deactivate
// @access  Private/Admin
export const deactivateGiftCard = asyncHandler(async (req, res) => {
  const giftCard = await GiftCard.findById(req.params.id);

  if (!giftCard) {
    res.status(404);
    throw new Error('Gift card not found');
  }

  giftCard.isActive = false;
  await giftCard.save();

  res.json({
    success: true,
    message: 'Gift card deactivated',
  });
});
