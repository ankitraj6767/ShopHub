import mongoose from 'mongoose';

const premiumSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One subscription per user
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    planName: {
      type: String,
      default: 'ShopHub Premium',
    },
    // Pricing
    price: {
      type: Number,
      required: true,
    },
    // Benefits
    discountPercent: {
      type: Number,
      default: 10, // 10% discount on all products
    },
    freeShipping: {
      type: Boolean,
      default: true,
    },
    prioritySupport: {
      type: Boolean,
      default: true,
    },
    earlyAccess: {
      type: Boolean,
      default: true, // Early access to deals
    },
    extraLoyaltyPoints: {
      type: Number,
      default: 2, // 2x loyalty points
    },
    // Status
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending'],
      default: 'pending',
    },
    // Dates
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    // Payment
    paymentMethod: {
      type: String,
      enum: ['stripe', 'card'],
      default: 'stripe',
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    lastPaymentDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    // Auto-renewal
    autoRenew: {
      type: Boolean,
      default: true,
    },
    // History
    paymentHistory: [
      {
        amount: Number,
        date: Date,
        status: {
          type: String,
          enum: ['success', 'failed', 'refunded'],
        },
        transactionId: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Check if subscription is active
premiumSubscriptionSchema.methods.isActive = function () {
  return this.status === 'active' && this.endDate > new Date();
};

// Get days remaining
premiumSubscriptionSchema.methods.getDaysRemaining = function () {
  if (!this.isActive()) return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Static method to check if user has active premium
premiumSubscriptionSchema.statics.hasActivePremium = async function (userId) {
  const subscription = await this.findOne({
    user: userId,
    status: 'active',
    endDate: { $gt: new Date() },
  });
  return !!subscription;
};

// Static method to get user's subscription
premiumSubscriptionSchema.statics.getUserSubscription = async function (userId) {
  return await this.findOne({ user: userId }).sort({ createdAt: -1 });
};

const PremiumSubscription = mongoose.model('PremiumSubscription', premiumSubscriptionSchema);

export default PremiumSubscription;
