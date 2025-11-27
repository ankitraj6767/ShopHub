import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please add a coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Please add a discount value'],
      min: [0, 'Discount value must be positive'],
    },
    minimumPurchase: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase must be positive'],
    },
    maximumDiscount: {
      type: Number,
      default: null,
    },
    validFrom: {
      type: Date,
      required: [true, 'Please add a valid from date'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Please add a valid until date'],
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
        },
      },
    ],
    applicableCategories: [
      {
        type: String,
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date lookup
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usageCount < this.usageLimit)
  );
});

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (cartTotal) {
  if (!this.isValid) return 0;
  if (cartTotal < this.minimumPurchase) return 0;

  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = (cartTotal * this.discountValue) / 100;
    if (this.maximumDiscount && discount > this.maximumDiscount) {
      discount = this.maximumDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  return Math.min(discount, cartTotal);
};

// Method to check if user can use coupon
couponSchema.methods.canBeUsedByUser = function (userId) {
  const userUsage = this.usedBy.filter(
    (u) => u.user.toString() === userId.toString()
  ).length;
  return userUsage < this.usageLimitPerUser;
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
