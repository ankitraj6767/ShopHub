import asyncHandler from 'express-async-handler';
import GiftCard from '../models/GiftCard.js';
import User from '../models/User.js';

// @desc    Purchase a gift card
// @route   POST /api/gift-cards
// @access  Private
export const purchaseGiftCard = asyncHandler(async (req, res) => {
  const { amount, recipientEmail, recipientName, senderName, message, theme } = req.body;

  if (amount < 10 || amount > 500) {
    res.status(400);
    throw new Error('Gift card amount must be between $10 and $500');
  }

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
    transactions: [
      {
        type: 'purchase',
        amount,
        user: req.user._id,
      },
    ],
  });

  // TODO: Send email to recipient with gift card details

  res.status(201).json({
    success: true,
    data: giftCard,
  });
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
