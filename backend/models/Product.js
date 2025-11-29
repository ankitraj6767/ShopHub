import mongoose from 'mongoose';

// Variant option schema (e.g., Size: S, M, L or Color: Red, Blue)
const variantOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Size", "Color"
  value: { type: String, required: true }, // e.g., "Large", "Red"
});

// SKU variant schema for specific combinations
const skuVariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  options: [variantOptionSchema], // e.g., [{name: "Size", value: "L"}, {name: "Color", value: "Red"}]
  price: { type: Number }, // Override price for this variant
  stock: { type: Number, default: 0 },
  image: { type: String }, // Variant-specific image
  isAvailable: { type: Boolean, default: true },
});

// Specifications schema for product details
const specificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
      maxlength: [200, 'Name cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [2000, 'Description cannot be more than 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: [
        'Electronics',
        'Clothing',
        'Home & Garden',
        'Sports & Outdoors',
        'Books',
        'Toys & Games',
        'Health & Beauty',
        'Automotive',
        'Food & Grocery',
        'Other',
      ],
    },
    brand: {
      type: String,
      required: [true, 'Please add a brand'],
      trim: true,
      maxlength: [100, 'Brand cannot be more than 100 characters'],
    },
    images: [
      {
        url: { type: String, required: true },
        alt: { type: String, default: '' },
      },
    ],
    // Product variants (Size, Color, etc.)
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variantTypes: [{ type: String }], // e.g., ["Size", "Color"]
    variants: [skuVariantSchema],
    // Product specifications
    specifications: [specificationSchema],
    // Tags for better search
    tags: [{ type: String, trim: true }],
    // Weight for shipping calculation
    weight: {
      value: { type: Number },
      unit: { type: String, enum: ['kg', 'lb', 'g', 'oz'], default: 'kg' },
    },
    // Dimensions for shipping
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, enum: ['cm', 'in'], default: 'cm' },
    },
    // Subscription options
    isSubscribable: {
      type: Boolean,
      default: false,
    },
    subscriptionDiscount: {
      type: Number,
      default: 5, // 5% discount for subscription
      min: 0,
      max: 50,
    },
    // Warranty info
    warranty: {
      available: { type: Boolean, default: false },
      duration: { type: String }, // e.g., "1 year", "6 months"
      description: { type: String },
    },
    // Return policy
    returnWindow: {
      type: Number,
      default: 30, // Days
    },
    isReturnable: {
      type: Boolean,
      default: true,
    },
    // Gift wrap available
    giftWrapAvailable: {
      type: Boolean,
      default: true,
    },
    giftWrapPrice: {
      type: Number,
      default: 5.99,
    },
    stock: {
      type: Number,
      required: [true, 'Please add stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    // Rating breakdown
    ratingBreakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // Best seller flag
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    // Amazon Choice equivalent
    isTopRated: {
      type: Boolean,
      default: false,
    },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

// Index for search
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ featured: 1 });

// Update rating when reviews change
productSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: this._id } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.rating = Math.round(stats[0].avgRating * 10) / 10;
    this.numReviews = stats[0].numReviews;
  } else {
    this.rating = 0;
    this.numReviews = 0;
  }
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
