import mongoose from 'mongoose';

const loyaltyPointSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    lifetimePoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    history: [
      {
        type: {
          type: String,
          enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral'],
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        description: String,
        orderId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Order',
        },
        referredUser: {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate tier based on lifetime points
loyaltyPointSchema.methods.calculateTier = function () {
  const points = this.lifetimePoints;
  if (points >= 50000) return 'Diamond';
  if (points >= 20000) return 'Platinum';
  if (points >= 10000) return 'Gold';
  if (points >= 5000) return 'Silver';
  return 'Bronze';
};

// Add points
loyaltyPointSchema.methods.addPoints = function (amount, type, description, orderId = null, referredUser = null) {
  this.points += amount;
  this.lifetimePoints += amount;
  this.tier = this.calculateTier();
  this.history.push({
    type,
    points: amount,
    description,
    orderId,
    referredUser,
  });
  return this.save();
};

// Redeem points
loyaltyPointSchema.methods.redeemPoints = function (amount, description) {
  if (this.points < amount) {
    throw new Error('Insufficient points');
  }
  this.points -= amount;
  this.history.push({
    type: 'redeemed',
    points: -amount,
    description,
  });
  return this.save();
};

// Get tier benefits
loyaltyPointSchema.methods.getTierBenefits = function () {
  const benefits = {
    Bronze: { pointsMultiplier: 1, freeShipping: false, exclusiveDeals: false, birthdayBonus: 0 },
    Silver: { pointsMultiplier: 1.25, freeShipping: false, exclusiveDeals: true, birthdayBonus: 100 },
    Gold: { pointsMultiplier: 1.5, freeShipping: true, exclusiveDeals: true, birthdayBonus: 250 },
    Platinum: { pointsMultiplier: 2, freeShipping: true, exclusiveDeals: true, birthdayBonus: 500 },
    Diamond: { pointsMultiplier: 3, freeShipping: true, exclusiveDeals: true, birthdayBonus: 1000 },
  };
  return benefits[this.tier];
};

loyaltyPointSchema.index({ user: 1 }, { unique: true });

const LoyaltyPoint = mongoose.model('LoyaltyPoint', loyaltyPointSchema);

export default LoyaltyPoint;
