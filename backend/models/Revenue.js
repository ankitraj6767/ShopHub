import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['order', 'subscription', 'gift_card', 'refund', 'other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    // Reference to the source document
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'sourceModel',
    },
    sourceModel: {
      type: String,
      required: true,
      enum: ['Order', 'PremiumSubscription', 'GiftCard'],
    },
    // User who made the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'cod', 'wallet', 'gift_card', 'other'],
      required: true,
    },
    transactionId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    // Additional metadata
    description: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Refund info (if refunded)
    refundedAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
revenueSchema.index({ type: 1, createdAt: -1 });
revenueSchema.index({ user: 1, createdAt: -1 });
revenueSchema.index({ status: 1, createdAt: -1 });
revenueSchema.index({ createdAt: -1 });

// Static method to get revenue summary
revenueSchema.statics.getRevenueSummary = async function (startDate, endDate) {
  const match = {
    status: 'completed',
  };
  
  if (startDate) {
    match.createdAt = { $gte: new Date(startDate) };
  }
  if (endDate) {
    match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  }

  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        refundedAmount: { $sum: '$refundedAmount' },
      },
    },
  ]);

  const result = {
    orders: { total: 0, count: 0, refunded: 0 },
    subscriptions: { total: 0, count: 0, refunded: 0 },
    giftCards: { total: 0, count: 0, refunded: 0 },
    total: 0,
    netRevenue: 0,
  };

  summary.forEach((item) => {
    if (item._id === 'order') {
      result.orders = { total: item.totalAmount, count: item.count, refunded: item.refundedAmount };
    } else if (item._id === 'subscription') {
      result.subscriptions = { total: item.totalAmount, count: item.count, refunded: item.refundedAmount };
    } else if (item._id === 'gift_card') {
      result.giftCards = { total: item.totalAmount, count: item.count, refunded: item.refundedAmount };
    }
    result.total += item.totalAmount;
    result.netRevenue += item.totalAmount - item.refundedAmount;
  });

  return result;
};

// Static method to get daily revenue
revenueSchema.statics.getDailyRevenue = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        breakdown: {
          $push: {
            type: '$_id.type',
            amount: '$amount',
            count: '$count',
          },
        },
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: '$count' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to get monthly revenue
revenueSchema.statics.getMonthlyRevenue = async function (months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await this.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          type: '$type',
        },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month',
        },
        breakdown: {
          $push: {
            type: '$_id.type',
            amount: '$amount',
            count: '$count',
          },
        },
        totalAmount: { $sum: '$amount' },
        totalCount: { $sum: '$count' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);
};

// Static method to record order payment
revenueSchema.statics.recordOrderPayment = async function (order, paymentDetails) {
  return await this.create({
    type: 'order',
    amount: order.totalPrice,
    sourceId: order._id,
    sourceModel: 'Order',
    user: order.user,
    paymentMethod: paymentDetails.method || 'razorpay',
    transactionId: paymentDetails.transactionId,
    razorpayOrderId: paymentDetails.razorpayOrderId,
    razorpayPaymentId: paymentDetails.razorpayPaymentId,
    description: `Payment for Order #${order.orderNumber}`,
    metadata: {
      orderNumber: order.orderNumber,
      itemsCount: order.orderItems?.length,
    },
  });
};

// Static method to record subscription payment
revenueSchema.statics.recordSubscriptionPayment = async function (subscription, paymentDetails) {
  return await this.create({
    type: 'subscription',
    amount: subscription.price,
    sourceId: subscription._id,
    sourceModel: 'PremiumSubscription',
    user: subscription.user,
    paymentMethod: paymentDetails.method || 'razorpay',
    transactionId: paymentDetails.transactionId,
    razorpayOrderId: paymentDetails.razorpayOrderId,
    razorpayPaymentId: paymentDetails.razorpayPaymentId,
    description: `Premium Subscription - ${subscription.planName}`,
    metadata: {
      plan: subscription.plan,
      planName: subscription.planName,
      duration: subscription.plan === 'monthly' ? 30 : 365,
    },
  });
};

const Revenue = mongoose.model('Revenue', revenueSchema);

export default Revenue;
