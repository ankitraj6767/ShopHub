import mongoose from 'mongoose';
import crypto from 'crypto';

const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    referralCode: {
      type: String,
      unique: true,
      required: true,
    },
    referrals: [
      {
        referredUser: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'expired'],
          default: 'pending',
        },
        referrerReward: {
          type: Number,
          default: 0,
        },
        referredReward: {
          type: Number,
          default: 0,
        },
        firstOrderId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Order',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        completedAt: Date,
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    successfulReferrals: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code
referralSchema.statics.generateCode = function (userId) {
  const prefix = userId.toString().slice(-4).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REF-${prefix}${random}`;
};

// Add a new referral
referralSchema.methods.addReferral = function (referredUserId) {
  this.referrals.push({
    referredUser: referredUserId,
    status: 'pending',
  });
  this.totalReferrals += 1;
  return this.save();
};

// Complete a referral (when referred user makes first purchase)
referralSchema.methods.completeReferral = async function (referredUserId, orderId, referrerReward = 500, referredReward = 200) {
  const referral = this.referrals.find(
    (r) => r.referredUser.toString() === referredUserId.toString() && r.status === 'pending'
  );
  
  if (!referral) {
    throw new Error('Referral not found or already completed');
  }
  
  referral.status = 'completed';
  referral.referrerReward = referrerReward;
  referral.referredReward = referredReward;
  referral.firstOrderId = orderId;
  referral.completedAt = new Date();
  
  this.totalEarnings += referrerReward;
  this.successfulReferrals += 1;
  
  return this.save();
};

referralSchema.index({ referrer: 1 }, { unique: true });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;
