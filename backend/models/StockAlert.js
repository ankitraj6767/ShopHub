import mongoose from 'mongoose';

const stockAlertSchema = new mongoose.Schema(
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
    email: {
      type: String,
      required: true,
    },
    isNotified: {
      type: Boolean,
      default: false,
    },
    notifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicates
stockAlertSchema.index({ user: 1, product: 1 }, { unique: true });

const StockAlert = mongoose.model('StockAlert', stockAlertSchema);

export default StockAlert;
