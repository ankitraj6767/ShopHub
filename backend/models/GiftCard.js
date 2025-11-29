import mongoose from 'mongoose';
import crypto from 'crypto';

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      required: true,
    },
    initialBalance: {
      type: Number,
      required: [true, 'Please add an initial balance'],
      min: [1, 'Balance must be at least ₹1'],
    },
    currentBalance: {
      type: Number,
      required: true,
    },
    purchasedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    recipientEmail: {
      type: String,
    },
    recipientName: {
      type: String,
    },
    senderName: {
      type: String,
    },
    message: {
      type: String,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    theme: {
      type: String,
      enum: ['birthday', 'holiday', 'thankyou', 'congratulations', 'general'],
      default: 'general',
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    redeemedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    redeemedByUsers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    }],
    transactions: [
      {
        type: {
          type: String,
          enum: ['purchase', 'redemption', 'refund'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        orderId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Order',
        },
        user: {
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

// Generate unique gift card code
giftCardSchema.statics.generateCode = function () {
  const prefix = 'GIFT';
  const randomPart = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8)}`;
};

// Check if card is valid
giftCardSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.currentBalance <= 0) return false;
  if (this.expiryDate && new Date() > this.expiryDate) return false;
  return true;
};

// Use gift card
giftCardSchema.methods.use = function (amount, orderId, userId) {
  if (!this.isValid()) {
    throw new Error('Gift card is not valid');
  }
  if (amount > this.currentBalance) {
    throw new Error('Insufficient gift card balance');
  }
  
  this.currentBalance -= amount;
  this.transactions.push({
    type: 'redemption',
    amount: -amount,
    orderId,
    user: userId,
  });
  
  if (!this.redeemedBy) {
    this.redeemedBy = userId;
  }
  
  return this.save();
};

// Refund to gift card
giftCardSchema.methods.refund = function (amount, orderId, userId) {
  this.currentBalance += amount;
  this.transactions.push({
    type: 'refund',
    amount,
    orderId,
    user: userId,
  });
  return this.save();
};

giftCardSchema.index({ purchasedBy: 1 });
giftCardSchema.index({ redeemedBy: 1 });
giftCardSchema.index({ redeemedByUsers: 1 });

const GiftCard = mongoose.model('GiftCard', giftCardSchema);

export default GiftCard;
