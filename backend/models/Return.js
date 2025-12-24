import mongoose from 'mongoose';

// Schema for individual return items
const returnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  returnReason: { type: String, required: true },
  itemCondition: {
    type: String,
    enum: ['unopened', 'opened_unused', 'opened_used', 'damaged', 'defective'],
    default: 'unopened',
  },
});

// Schema for return status history
const returnStatusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: { type: String },
  isCustomerVisible: { type: Boolean, default: true },
});

// Schema for return pickup/shipping
const returnShippingSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['pickup', 'drop_off', 'courier', 'self_ship'],
    default: 'pickup',
  },
  pickupAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  pickupDate: { type: Date },
  pickupTimeSlot: { type: String },
  trackingNumber: { type: String },
  carrier: { type: String },
  shippingLabel: { type: String }, // URL to shipping label
  receivedAt: { type: Date },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  condition: {
    type: String,
    enum: ['as_described', 'different_condition', 'damaged_in_transit', 'missing_items'],
  },
  conditionNotes: { type: String },
});

// Schema for refund details
const refundSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ['original_payment', 'wallet', 'bank_transfer', 'store_credit', 'gift_card'],
    default: 'original_payment',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  transactionId: { type: String },
  processedAt: { type: Date },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
  },
  failureReason: { type: String },
  // Breakdown of refund
  breakdown: {
    itemsTotal: { type: Number, default: 0 },
    shippingRefund: { type: Number, default: 0 },
    taxRefund: { type: Number, default: 0 },
    restockingFee: { type: Number, default: 0 },
    adjustments: { type: Number, default: 0 },
  },
});

// Schema for exchange details (if applicable)
const exchangeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['same_product', 'different_variant', 'different_product'],
  },
  newProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  newProductName: { type: String },
  newProductVariant: { type: String },
  priceDifference: { type: Number, default: 0 },
  newOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
});

// Main Return Schema
const returnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [returnItemSchema],
    
    // Return type
    type: {
      type: String,
      enum: ['return', 'exchange', 'replacement'],
      default: 'return',
    },
    
    // Primary reason for return
    reason: {
      type: String,
      enum: [
        'wrong_item',
        'damaged_defective',
        'not_as_described',
        'quality_not_expected',
        'wrong_size_fit',
        'changed_mind',
        'better_price_elsewhere',
        'arrived_late',
        'missing_parts',
        'other',
      ],
      required: true,
    },
    reasonDetail: { type: String, required: true },
    
    // Status tracking
    status: {
      type: String,
      enum: [
        'requested',      // Customer submitted return request
        'pending_approval', // Awaiting admin review
        'approved',       // Return approved
        'rejected',       // Return rejected
        'pickup_scheduled', // Pickup has been scheduled
        'in_transit',     // Item is being shipped back
        'received',       // Warehouse received the item
        'inspecting',     // Item is being inspected
        'inspection_passed', // Item passed inspection
        'inspection_failed', // Item failed inspection
        'processing_refund', // Refund is being processed
        'refund_completed',  // Refund has been completed
        'exchange_processing', // Processing exchange
        'exchange_shipped',    // Exchange item shipped
        'completed',      // Return process complete
        'cancelled',      // Return cancelled
      ],
      default: 'requested',
    },
    statusHistory: [returnStatusHistorySchema],
    
    // Shipping/Pickup details
    shipping: returnShippingSchema,
    
    // Refund details
    refund: refundSchema,
    
    // Exchange details (if type is exchange or replacement)
    exchange: exchangeSchema,
    
    // Images/proof uploaded by customer
    images: [{
      url: { type: String },
      description: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    }],
    
    // Admin notes (internal only)
    adminNotes: [{
      note: { type: String },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: { type: Date, default: Date.now },
    }],
    
    // Customer communication
    customerMessages: [{
      message: { type: String },
      sender: {
        type: String,
        enum: ['customer', 'admin', 'system'],
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sentAt: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false },
    }],
    
    // Dates
    requestedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },
    
    // Processing details
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: { type: String },
    
    // Quality check results
    qualityCheck: {
      passed: { type: Boolean },
      checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      checkedAt: { type: Date },
      notes: { type: String },
      issues: [{ type: String }],
    },
    
    // SLA tracking
    sla: {
      expectedApprovalBy: { type: Date },
      expectedCompletionBy: { type: Date },
      isOverdue: { type: Boolean, default: false },
      escalated: { type: Boolean, default: false },
      escalatedAt: { type: Date },
    },
    
    // Linked to loyalty points (if applicable)
    loyaltyPointsDeducted: { type: Number, default: 0 },
    
    // Priority
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    
    // Tags for filtering
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
returnSchema.index({ order: 1 });
returnSchema.index({ user: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ createdAt: -1 });
returnSchema.index({ 'refund.status': 1 });
returnSchema.index({ type: 1, status: 1 });

// Generate return number before saving
returnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await mongoose.model('Return').countDocuments();
    this.returnNumber = `RET${year}${month}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to add status history
returnSchema.methods.addStatusHistory = function (status, userId, note, isCustomerVisible = true) {
  this.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: userId,
    note,
    isCustomerVisible,
  });
  this.status = status;
};

// Method to calculate refund amount
returnSchema.methods.calculateRefundAmount = function (options = {}) {
  const { includeShipping = false, restockingFeePercent = 0 } = options;
  
  let itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let restockingFee = (itemsTotal * restockingFeePercent) / 100;
  let shippingRefund = 0;
  
  // Include shipping refund if applicable
  if (includeShipping && this.order?.shippingPrice) {
    shippingRefund = this.order.shippingPrice;
  }
  
  // Calculate tax refund (proportional)
  const taxRefund = this.order?.taxPrice 
    ? (this.order.taxPrice * itemsTotal / this.order.itemsPrice) 
    : 0;
  
  const totalRefund = itemsTotal + shippingRefund + taxRefund - restockingFee;
  
  return {
    itemsTotal: Math.round(itemsTotal * 100) / 100,
    shippingRefund: Math.round(shippingRefund * 100) / 100,
    taxRefund: Math.round(taxRefund * 100) / 100,
    restockingFee: Math.round(restockingFee * 100) / 100,
    total: Math.round(totalRefund * 100) / 100,
  };
};

// Static method to get return statistics
returnSchema.statics.getReturnStats = async function (startDate, endDate) {
  const match = {};
  if (startDate) match.createdAt = { $gte: new Date(startDate) };
  if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRefundAmount: {
          $sum: {
            $cond: [{ $eq: ['$refund.status', 'completed'] }, '$refund.amount', 0]
          }
        },
      },
    },
  ]);
  
  const reasonStats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  
  return { statusStats: stats, reasonStats };
};

// Virtual for items count
returnSchema.virtual('itemsCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Ensure virtuals are included in JSON
returnSchema.set('toJSON', { virtuals: true });
returnSchema.set('toObject', { virtuals: true });

const Return = mongoose.model('Return', returnSchema);

export default Return;
