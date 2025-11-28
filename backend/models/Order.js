import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  returnStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'returned', 'refunded'],
    default: 'none',
  },
  returnReason: { type: String },
  returnRequestedAt: { type: Date },
  returnProcessedAt: { type: Date },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'USA' },
  phone: { type: String },
});

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['Credit Card', 'PayPal', 'Cash on Delivery', 'Stripe', 'UPI'],
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded', 'partial_refund', 'pending'],
    default: 'unpaid',
  },
  transactionId: { type: String },
  paidAt: { type: Date },
  refundedAmount: { type: Number, default: 0 },
  refundedAt: { type: Date },
});

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: { type: String, unique: true },
    orderItems: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentInfo: paymentInfoSchema,
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    couponCode: { type: String },
    walletAmount: {
      type: Number,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned'],
      default: 'Pending',
    },
    statusHistory: [statusHistorySchema],
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    estimatedDelivery: { type: Date },
    trackingNumber: { type: String },
    trackingUrl: { type: String },
    carrier: { type: String },
    notes: { type: String },
    giftMessage: { type: String },
    isGift: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Generate order number
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

// Add status to history
orderSchema.methods.addStatusHistory = function (status, userId, note) {
  this.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: userId,
    note,
  });
};

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
