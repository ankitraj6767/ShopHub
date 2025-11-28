import asyncHandler from 'express-async-handler';
import LoyaltyPoint from '../models/LoyaltyPoint.js';
import User from '../models/User.js';

// Points configuration
const POINTS_CONFIG = {
  purchaseRate: 10, // Points per $1 spent
  reviewPoints: 50,
  referralPoints: 500,
  signupBonus: 100,
  birthdayBonus: {
    Bronze: 50,
    Silver: 100,
    Gold: 250,
    Platinum: 500,
    Diamond: 1000,
  },
  redemptionRate: 100, // 100 points = $1
};

// @desc    Get user's loyalty points
// @route   GET /api/loyalty
// @access  Private
export const getLoyaltyPoints = asyncHandler(async (req, res) => {
  let loyalty = await LoyaltyPoint.findOne({ user: req.user._id });

  if (!loyalty) {
    // Check if there's a pending referral for this user - if so, don't create signup bonus
    // The referral apply endpoint will create the loyalty record
    const Referral = (await import('../models/Referral.js')).default;
    const hasReferral = await Referral.findOne({
      'referrals.referredUser': req.user._id,
    });

    if (hasReferral) {
      // User was referred - create loyalty with referral bonus (200 points)
      loyalty = await LoyaltyPoint.create({
        user: req.user._id,
        points: 200, // Referral bonus
        lifetimePoints: 200,
        history: [
          {
            type: 'referral',
            points: 200,
            description: 'Referral signup bonus - Welcome gift!',
          },
        ],
      });
    } else {
      // Regular user - create loyalty with signup bonus (100 points)
      loyalty = await LoyaltyPoint.create({
        user: req.user._id,
        points: POINTS_CONFIG.signupBonus,
        lifetimePoints: POINTS_CONFIG.signupBonus,
        history: [
          {
            type: 'bonus',
            points: POINTS_CONFIG.signupBonus,
            description: 'Welcome bonus for joining ShopHub!',
          },
        ],
      });
    }
  }

  const benefits = loyalty.getTierBenefits();
  const nextTier = getNextTier(loyalty.tier);
  const pointsToNextTier = getPointsToNextTier(loyalty.lifetimePoints);

  res.json({
    success: true,
    data: {
      points: loyalty.points,
      lifetimePoints: loyalty.lifetimePoints,
      tier: loyalty.tier,
      benefits,
      nextTier,
      pointsToNextTier,
      history: loyalty.history.slice(-20).reverse(),
      config: POINTS_CONFIG,
    },
  });
});

// @desc    Earn points from purchase
// @route   POST /api/loyalty/earn
// @access  Private
export const earnPoints = asyncHandler(async (req, res) => {
  const { amount, orderId, description } = req.body;

  let loyalty = await LoyaltyPoint.findOne({ user: req.user._id });

  if (!loyalty) {
    loyalty = await LoyaltyPoint.create({
      user: req.user._id,
      points: 0,
      lifetimePoints: 0,
    });
  }

  const benefits = loyalty.getTierBenefits();
  const basePoints = Math.floor(amount * POINTS_CONFIG.purchaseRate);
  const bonusPoints = Math.floor(basePoints * (benefits.pointsMultiplier - 1));
  const totalPoints = basePoints + bonusPoints;

  await loyalty.addPoints(
    totalPoints,
    'earned',
    description || `Earned from order: ${basePoints} base + ${bonusPoints} tier bonus`,
    orderId
  );

  res.json({
    success: true,
    data: {
      pointsEarned: totalPoints,
      basePoints,
      bonusPoints,
      newBalance: loyalty.points,
      tier: loyalty.tier,
    },
  });
});

// @desc    Redeem points
// @route   POST /api/loyalty/redeem
// @access  Private
export const redeemPoints = asyncHandler(async (req, res) => {
  const { points } = req.body;

  if (!points || points < 100) {
    res.status(400);
    throw new Error('Minimum 100 points required to redeem');
  }

  const loyalty = await LoyaltyPoint.findOne({ user: req.user._id });

  if (!loyalty) {
    res.status(404);
    throw new Error('Loyalty account not found');
  }

  if (loyalty.points < points) {
    res.status(400);
    throw new Error('Insufficient points');
  }

  const dollarValue = points / POINTS_CONFIG.redemptionRate;

  // Redeem points from loyalty
  await loyalty.redeemPoints(points, `Redeemed ${points} points for $${dollarValue.toFixed(2)} wallet credit`);

  // Add to user's wallet
  const user = await User.findById(req.user._id);
  user.walletBalance = (user.walletBalance || 0) + dollarValue;
  
  // Initialize walletHistory if it doesn't exist
  if (!user.walletHistory) {
    user.walletHistory = [];
  }
  
  user.walletHistory.push({
    type: 'credit',
    amount: dollarValue,
    description: `Redeemed ${points} loyalty points`,
    pointsRedeemed: points,
  });
  await user.save();

  res.json({
    success: true,
    message: `Successfully added $${dollarValue.toFixed(2)} to your wallet!`,
    data: {
      pointsRedeemed: points,
      dollarValue,
      remainingPoints: loyalty.points,
      newWalletBalance: user.walletBalance,
    },
  });
});

// @desc    Get leaderboard
// @route   GET /api/loyalty/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await LoyaltyPoint.find()
    .populate('user', 'name')
    .sort({ lifetimePoints: -1 })
    .limit(10)
    .select('lifetimePoints tier user');

  res.json({
    success: true,
    data: leaderboard.map((entry, index) => ({
      rank: index + 1,
      name: entry.user?.name || 'Anonymous',
      points: entry.lifetimePoints,
      tier: entry.tier,
    })),
  });
});

// @desc    Get tier info
// @route   GET /api/loyalty/tiers
// @access  Public
export const getTierInfo = asyncHandler(async (req, res) => {
  const tiers = [
    {
      name: 'Bronze',
      minPoints: 0,
      benefits: ['1x points multiplier', 'Standard shipping rates'],
    },
    {
      name: 'Silver',
      minPoints: 5000,
      benefits: ['1.25x points multiplier', 'Exclusive deals access', '100 birthday bonus points'],
    },
    {
      name: 'Gold',
      minPoints: 10000,
      benefits: ['1.5x points multiplier', 'Free shipping on all orders', 'Exclusive deals', '250 birthday bonus'],
    },
    {
      name: 'Platinum',
      minPoints: 20000,
      benefits: ['2x points multiplier', 'Free shipping', 'Priority support', '500 birthday bonus'],
    },
    {
      name: 'Diamond',
      minPoints: 50000,
      benefits: ['3x points multiplier', 'Free express shipping', 'VIP support', '1000 birthday bonus', 'Early access to sales'],
    },
  ];

  res.json({
    success: true,
    data: tiers,
  });
});

// Helper functions
function getNextTier(currentTier) {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function getPointsToNextTier(currentPoints) {
  const thresholds = { Silver: 5000, Gold: 10000, Platinum: 20000, Diamond: 50000 };
  for (const [tier, points] of Object.entries(thresholds)) {
    if (currentPoints < points) {
      return { tier, pointsNeeded: points - currentPoints };
    }
  }
  return null;
}
