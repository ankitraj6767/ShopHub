import mongoose from 'mongoose';

const subscriptionItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  variant: {
    sku: { type: String },
    options: [{ name: String, value: String }],
  },
});

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriptionNumber: { type: String, unique: true },
    items: [subscriptionItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'USA' },
      phone: { type: String },
    },
    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly'],
      default: 'monthly',
    },
    // Discount percentage for subscription
    discountPercent: {
      type: Number,
      default: 5,
      min: 0,
      max: 50,
    },
    // Pricing
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    taxPrice: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    // Payment
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Credit Card', 'Stripe'],
    },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    // Status
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'expired'],
      default: 'active',
    },
    // Dates
    nextDeliveryDate: { type: Date, required: true },
    lastDeliveryDate: { type: Date },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    pausedAt: { type: Date },
    cancelledAt: { type: Date },
    // Delivery history
    deliveries: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        deliveredAt: { type: Date },
        status: { type: String },
      },
    ],
    // Number of deliveries completed
    deliveryCount: { type: Number, default: 0 },
    // Skip next delivery
    skipNextDelivery: { type: Boolean, default: false },
    // Notes
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Generate subscription number
subscriptionSchema.pre('save', async function (next) {
  if (this.isNew && !this.subscriptionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.subscriptionNumber = `SUB-${year}${month}-${random}`;
  }
  next();
});

// Calculate next delivery date based on frequency
subscriptionSchema.methods.calculateNextDelivery = function () {
  const now = new Date();
  let nextDate = new Date(this.nextDeliveryDate || now);

  switch (this.frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'bimonthly':
      nextDate.setMonth(nextDate.getMonth() + 2);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
  }

  return nextDate;
};

// Indexes
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ nextDeliveryDate: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
