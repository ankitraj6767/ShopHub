import asyncHandler from 'express-async-handler';
import Referral from '../models/Referral.js';
import LoyaltyPoint from '../models/LoyaltyPoint.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const REFERRAL_REWARDS = {
  referrer: 500, // Points for the person who referred
  referred: 200, // Points for the new user
};

// @desc    Get user's referral info
// @route   GET /api/referrals
// @access  Private
export const getReferralInfo = asyncHandler(async (req, res) => {
  let referral = await Referral.findOne({ referrer: req.user._id })
    .populate('referrals.referredUser', 'name email createdAt');

  if (!referral) {
    // Create referral account
    const code = Referral.generateCode(req.user._id);
    referral = await Referral.create({
      referrer: req.user._id,
      referralCode: code,
    });
  }

  // Check if the current user was referred by someone
  let referredByInfo = null;
  const referredByRecord = await Referral.findOne({
    'referrals.referredUser': req.user._id,
  }).populate('referrer', 'name');

  if (referredByRecord) {
    const myReferralEntry = referredByRecord.referrals.find(
      r => r.referredUser.toString() === req.user._id.toString()
    );
    referredByInfo = {
      referrerName: referredByRecord.referrer?.name || 'A friend',
      status: myReferralEntry?.status || 'pending',
      bonusReceived: REFERRAL_REWARDS.referred,
      joinedAt: myReferralEntry?.createdAt,
    };
  }

  const referralLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${referral.referralCode}`;

  res.json({
    success: true,
    data: {
      referralCode: referral.referralCode,
      referralLink,
      totalReferrals: referral.totalReferrals,
      successfulReferrals: referral.successfulReferrals,
      totalEarnings: referral.totalEarnings,
      referrals: referral.referrals.map(r => ({
        user: r.referredUser?.name || 'Anonymous',
        status: r.status,
        reward: r.referrerReward,
        date: r.createdAt,
        completedAt: r.completedAt,
      })),
      rewards: REFERRAL_REWARDS,
      // Info about who referred this user (if anyone)
      referredBy: referredByInfo,
    },
  });
});

// @desc    Validate referral code
// @route   GET /api/referrals/validate/:code
// @access  Public
export const validateReferralCode = asyncHandler(async (req, res) => {
  const referral = await Referral.findOne({ referralCode: req.params.code })
    .populate('referrer', 'name');

  if (!referral) {
    res.status(404);
    throw new Error('Invalid referral code');
  }

  res.json({
    success: true,
    data: {
      valid: true,
      referrerName: referral.referrer?.name || 'A friend',
      reward: REFERRAL_REWARDS.referred,
    },
  });
});

// @desc    Apply referral code during registration
// @route   POST /api/referrals/apply
// @access  Private
export const applyReferralCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  // Check if user already used a referral code
  const existingReferral = await Referral.findOne({
    'referrals.referredUser': req.user._id,
  });

  if (existingReferral) {
    res.status(400);
    throw new Error('You have already used a referral code');
  }

  const referral = await Referral.findOne({ referralCode: code });

  if (!referral) {
    res.status(404);
    throw new Error('Invalid referral code');
  }

  if (referral.referrer.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot use your own referral code');
  }

  // Add referral (pending until first purchase)
  await referral.addReferral(req.user._id);

  // Give instant bonus to referred user
  let loyalty = await LoyaltyPoint.findOne({ user: req.user._id });
  
  if (!loyalty) {
    // Create new loyalty record with referral bonus
    try {
      loyalty = await LoyaltyPoint.create({
        user: req.user._id,
        points: REFERRAL_REWARDS.referred,
        lifetimePoints: REFERRAL_REWARDS.referred,
        history: [
          {
            type: 'referral',
            points: REFERRAL_REWARDS.referred,
            description: 'Referral signup bonus - Welcome gift!',
          },
        ],
      });
    } catch (err) {
      // If duplicate key error, find the existing record and add points
      if (err.code === 11000) {
        loyalty = await LoyaltyPoint.findOne({ user: req.user._id });
        if (loyalty) {
          await loyalty.addPoints(
            REFERRAL_REWARDS.referred,
            'referral',
            'Referral signup bonus - Welcome gift!'
          );
        }
      } else {
        throw err;
      }
    }
  } else {
    // Check if user already got referral bonus
    const hasReferralBonus = loyalty.history.some(h => h.type === 'referral' && h.description.includes('signup bonus'));
    if (!hasReferralBonus) {
      await loyalty.addPoints(
        REFERRAL_REWARDS.referred,
        'referral',
        'Referral signup bonus - Welcome gift!'
      );
      // Refresh loyalty to get updated points
      loyalty = await LoyaltyPoint.findOne({ user: req.user._id });
    }
  }

  // Create notification for the referred user
  await Notification.create({
    user: req.user._id,
    type: 'info',
    title: 'Welcome Bonus! 🎁',
    message: `You earned ${REFERRAL_REWARDS.referred} bonus points for joining via referral!`,
  });

  // Notify the referrer about the new signup
  await Notification.create({
    user: referral.referrer,
    type: 'info',
    title: 'New Referral Signup! 🎉',
    message: `Someone joined using your referral code! You'll earn ${REFERRAL_REWARDS.referrer} points when they make their first purchase.`,
  });

  res.json({
    success: true,
    message: `You earned ${REFERRAL_REWARDS.referred} bonus points!`,
    data: {
      pointsEarned: REFERRAL_REWARDS.referred,
      newBalance: loyalty.points,
    },
  });
});

// @desc    Complete referral (called when referred user makes first purchase)
// @route   POST /api/referrals/complete
// @access  Private (Internal use)
export const completeReferral = asyncHandler(async (req, res) => {
  const { userId, orderId } = req.body;

  const referral = await Referral.findOne({
    'referrals.referredUser': userId,
    'referrals.status': 'pending',
  });

  if (!referral) {
    return res.json({
      success: true,
      message: 'No pending referral found',
    });
  }

  // Complete the referral
  await referral.completeReferral(
    userId,
    orderId,
    REFERRAL_REWARDS.referrer,
    0 // Referred user already got bonus at signup
  );

  // Give points to referrer
  let referrerLoyalty = await LoyaltyPoint.findOne({ user: referral.referrer });
  if (!referrerLoyalty) {
    referrerLoyalty = await LoyaltyPoint.create({
      user: referral.referrer,
      points: REFERRAL_REWARDS.referrer,
      lifetimePoints: REFERRAL_REWARDS.referrer,
      history: [
        {
          type: 'referral',
          points: REFERRAL_REWARDS.referrer,
          description: 'Referral reward - friend made first purchase',
          referredUser: userId,
        },
      ],
    });
  } else {
    await referrerLoyalty.addPoints(
      REFERRAL_REWARDS.referrer,
      'referral',
      'Referral reward - friend made first purchase',
      null,
      userId
    );
  }

  res.json({
    success: true,
    message: 'Referral completed',
    data: {
      referrerReward: REFERRAL_REWARDS.referrer,
    },
  });
});

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
// @access  Public
export const getReferralLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await Referral.find({ successfulReferrals: { $gt: 0 } })
    .populate('referrer', 'name')
    .sort({ successfulReferrals: -1 })
    .limit(10)
    .select('successfulReferrals totalEarnings referrer');

  res.json({
    success: true,
    data: leaderboard.map((entry, index) => ({
      rank: index + 1,
      name: entry.referrer?.name || 'Anonymous',
      referrals: entry.successfulReferrals,
      earnings: entry.totalEarnings,
    })),
  });
});
