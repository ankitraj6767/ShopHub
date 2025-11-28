import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a sale name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    products: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true,
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
          required: true,
        },
        sold: {
          type: Number,
          default: 0,
        },
      },
    ],
    startTime: {
      type: Date,
      required: [true, 'Please add a start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please add an end time'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    banner: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
flashSaleSchema.index({ startTime: 1, endTime: 1, isActive: 1 });

// Virtual to check if sale is currently live
flashSaleSchema.virtual('isLive').get(function () {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
});

// Virtual to check if sale has ended
flashSaleSchema.virtual('hasEnded').get(function () {
  return new Date() > this.endTime;
});

// Virtual to get time remaining
flashSaleSchema.virtual('timeRemaining').get(function () {
  const now = new Date();
  if (now > this.endTime) return 0;
  if (now < this.startTime) return this.startTime - now;
  return this.endTime - now;
});

flashSaleSchema.set('toJSON', { virtuals: true });
flashSaleSchema.set('toObject', { virtuals: true });

const FlashSale = mongoose.model('FlashSale', flashSaleSchema);

export default FlashSale;
