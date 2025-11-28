import mongoose from 'mongoose';

const productBundleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a bundle name'],
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
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],
    originalPrice: {
      type: Number,
      required: true,
    },
    bundlePrice: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    savings: {
      type: Number,
      default: 0,
    },
    savingsPercentage: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 100,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    validFrom: Date,
    validUntil: Date,
  },
  {
    timestamps: true,
  }
);

// Calculate savings before save
productBundleSchema.pre('save', function (next) {
  this.savings = this.originalPrice - this.bundlePrice;
  this.savingsPercentage = Math.round((this.savings / this.originalPrice) * 100);
  // Also set discountPercentage if not already set
  if (!this.discountPercentage) {
    this.discountPercentage = this.savingsPercentage;
  }
  next();
});

// Check if bundle is available
productBundleSchema.methods.isAvailable = function () {
  if (!this.isActive) return false;
  if (this.stock <= 0) return false;
  const now = new Date();
  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;
  return true;
};

productBundleSchema.index({ isActive: 1, featured: 1 });

const ProductBundle = mongoose.model('ProductBundle', productBundleSchema);

export default ProductBundle;
