import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5'],
    },
    title: {
      type: String,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      maxlength: [2000, 'Comment cannot be more than 2000 characters'],
    },
    images: [
      {
        url: { type: String },
        alt: { type: String },
      },
    ],
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    votedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        helpful: {
          type: Boolean,
        },
        votedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isRecommended: {
      type: Boolean,
      default: true,
    },
    pros: [
      {
        type: String,
        maxlength: [100, 'Pro cannot exceed 100 characters'],
      },
    ],
    cons: [
      {
        type: String,
        maxlength: [100, 'Con cannot exceed 100 characters'],
      },
    ],
    isApproved: {
      type: Boolean,
      default: true,
    },
    adminResponse: {
      comment: { type: String },
      respondedAt: { type: Date },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Update product rating after save
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating();
  }
});

// Update product rating after remove
reviewSchema.post('deleteOne', { document: true, query: false }, async function () {
  const Product = mongoose.model('Product');
  const product = await Product.findById(this.product);
  if (product) {
    await product.updateRating();
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
