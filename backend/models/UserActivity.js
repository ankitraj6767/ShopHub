import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Recently viewed products
    recentlyViewed: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        viewCount: {
          type: Number,
          default: 1,
        },
      },
    ],
    // Search history
    searchHistory: [
      {
        query: String,
        searchedAt: {
          type: Date,
          default: Date.now,
        },
        resultsCount: Number,
      },
    ],
    // Category preferences (calculated from browsing)
    categoryPreferences: [
      {
        category: String,
        score: {
          type: Number,
          default: 0,
        },
        lastInteraction: Date,
      },
    ],
    // Brand preferences
    brandPreferences: [
      {
        brand: String,
        score: {
          type: Number,
          default: 0,
        },
        lastInteraction: Date,
      },
    ],
    // Price range preferences
    pricePreference: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100000 },
      average: { type: Number, default: 0 },
    },
    // Quick buy list (frequently purchased items)
    quickBuyList: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        purchaseCount: {
          type: Number,
          default: 0,
        },
        lastPurchased: Date,
      },
    ],
    // Saved cart templates (for repeat orders)
    savedCarts: [
      {
        name: {
          type: String,
          required: true,
        },
        items: [
          {
            product: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Product',
            },
            quantity: {
              type: Number,
              default: 1,
            },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Price drop alerts for wishlist items
    priceAlerts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        originalPrice: Number,
        targetPrice: Number,
        isActive: {
          type: Boolean,
          default: true,
        },
        notifiedAt: Date,
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

// Index for efficient queries
userActivitySchema.index({ user: 1 });
userActivitySchema.index({ 'recentlyViewed.product': 1 });
userActivitySchema.index({ 'priceAlerts.product': 1, 'priceAlerts.isActive': 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity;
