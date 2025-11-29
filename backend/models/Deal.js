import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    dealType: {
      type: String,
      enum: ['deal_of_day', 'weekly', 'clearance', 'flash', 'special'],
      default: 'deal_of_day',
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 100,
    },
    sold: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0, // Higher priority = shown first
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
dealSchema.index({ startTime: 1, endTime: 1, isActive: 1, dealType: 1 });
dealSchema.index({ product: 1 });

// Virtual to check if deal is currently live
dealSchema.virtual('isLive').get(function () {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
});

// Virtual to check if deal has ended
dealSchema.virtual('hasEnded').get(function () {
  return new Date() > this.endTime;
});

// Virtual to get time remaining in ms
dealSchema.virtual('timeRemaining').get(function () {
  const now = new Date();
  if (now > this.endTime) return 0;
  if (now < this.startTime) return this.startTime - now;
  return this.endTime - now;
});

// Virtual for stock remaining
dealSchema.virtual('stockRemaining').get(function () {
  return Math.max(0, this.quantity - this.sold);
});

// Static method to get active deals of the day
dealSchema.statics.getActiveDealsOfDay = async function () {
  const now = new Date();
  return await this.find({
    dealType: 'deal_of_day',
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  })
    .populate('product', 'name images rating numReviews category brand stock')
    .sort({ priority: -1, createdAt: -1 })
    .limit(8);
};

// Static method to get all active deals
dealSchema.statics.getActiveDeals = async function (type = null, limit = 20) {
  const now = new Date();
  const query = {
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  };
  
  if (type) {
    query.dealType = type;
  }
  
  return await this.find(query)
    .populate('product', 'name images rating numReviews category brand stock')
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit);
};

const Deal = mongoose.model('Deal', dealSchema);

export default Deal;
