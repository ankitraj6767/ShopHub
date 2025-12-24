import asyncHandler from 'express-async-handler';
import Return from '../models/Return.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Revenue from '../models/Revenue.js';
import LoyaltyPoint from '../models/LoyaltyPoint.js';
import { sendEmail, emailTemplates } from '../utils/email.js';

// Return reasons with display text
const RETURN_REASONS = {
  wrong_item: 'Wrong item delivered',
  damaged_defective: 'Item damaged or defective',
  not_as_described: 'Not as described',
  quality_not_expected: 'Quality not as expected',
  wrong_size_fit: 'Wrong size/fit',
  changed_mind: 'Changed my mind',
  better_price_elsewhere: 'Found better price elsewhere',
  arrived_late: 'Item arrived late',
  missing_parts: 'Missing parts/accessories',
  other: 'Other reason',
};

// Item conditions
const ITEM_CONDITIONS = {
  unopened: 'Unopened/Sealed',
  opened_unused: 'Opened but unused',
  opened_used: 'Opened and used',
  damaged: 'Damaged',
  defective: 'Defective',
};

// Helper: Notify all admins
const notifyAllAdmins = async (notification) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      user: admin._id,
      ...notification
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

// Helper: Update revenue after refund
const updateRevenueAfterRefund = async (order, refundAmount, returnId) => {
  try {
    // Create a negative revenue entry for the refund
    await Revenue.create({
      type: 'refund',
      amount: -refundAmount,
      sourceId: returnId,
      sourceModel: 'Order', // Using Order as sourceModel since Return isn't in enum
      user: order.user,
      paymentMethod: order.paymentInfo?.method?.toLowerCase() === 'cash on delivery' ? 'cod' : 'razorpay',
      description: `Refund for Order #${order.orderNumber}`,
      status: 'completed',
      metadata: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        returnId: returnId,
      },
    });
  } catch (error) {
    console.error('Failed to update revenue after refund:', error);
  }
};

// Helper: Deduct loyalty points for returned order
const deductLoyaltyPointsForReturn = async (userId, orderTotal, returnId, returnAmount) => {
  try {
    const loyalty = await LoyaltyPoint.findOne({ user: userId });
    if (!loyalty) return null;
    
    // Calculate points to deduct (proportional to return amount)
    const pointsRate = 10; // Same as earning rate
    const pointsToDeduct = Math.floor((returnAmount / orderTotal) * orderTotal * pointsRate);
    
    if (pointsToDeduct > 0) {
      // Deduct points using negative earned points
      await loyalty.addPoints(
        -pointsToDeduct,
        'adjustment',
        `Points deducted for return #${returnId.toString().slice(-8).toUpperCase()}`,
        returnId
      );
      
      return pointsToDeduct;
    }
    return 0;
  } catch (error) {
    console.error('Failed to deduct loyalty points:', error);
    return null;
  }
};

// @desc    Get return options/eligibility for an order
// @route   GET /api/returns/eligibility/:orderId
// @access  Private
export const getReturnEligibility = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Check if order is delivered
  if (order.status !== 'Delivered') {
    return res.json({
      success: true,
      eligible: false,
      reason: 'Order must be delivered before requesting a return',
      order: {
        _id: order._id,
        status: order.status,
        deliveredAt: order.deliveredAt,
      },
    });
  }
  
  // Check return window (30 days from delivery)
  const deliveryDate = new Date(order.deliveredAt);
  const returnWindowDays = 30;
  const returnDeadline = new Date(deliveryDate.getTime() + returnWindowDays * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((returnDeadline - Date.now()) / (24 * 60 * 60 * 1000));
  
  if (Date.now() > returnDeadline) {
    return res.json({
      success: true,
      eligible: false,
      reason: 'Return window has expired (30 days from delivery)',
      order: {
        _id: order._id,
        deliveredAt: order.deliveredAt,
        returnDeadline,
      },
    });
  }
  
  // Check if return already exists
  const existingReturn = await Return.findOne({
    order: order._id,
    status: { $nin: ['cancelled', 'rejected'] },
  });
  
  if (existingReturn) {
    return res.json({
      success: true,
      eligible: false,
      reason: 'A return request already exists for this order',
      existingReturn: {
        _id: existingReturn._id,
        returnNumber: existingReturn.returnNumber,
        status: existingReturn.status,
      },
    });
  }
  
  // Get eligible items
  const eligibleItems = order.orderItems.map(item => ({
    product: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    returnStatus: item.returnStatus || 'none',
  })).filter(item => item.returnStatus === 'none');
  
  res.json({
    success: true,
    eligible: true,
    daysRemaining,
    returnDeadline,
    returnReasons: RETURN_REASONS,
    itemConditions: ITEM_CONDITIONS,
    eligibleItems,
    order: {
      _id: order._id,
      orderNumber: order.orderNumber,
      deliveredAt: order.deliveredAt,
      totalPrice: order.totalPrice,
      itemsPrice: order.itemsPrice,
      shippingPrice: order.shippingPrice,
      taxPrice: order.taxPrice,
    },
    policies: {
      returnWindow: 30,
      refundMethods: ['original_payment', 'wallet', 'bank_transfer'],
      restockingFee: 0, // No restocking fee by default
      freePickup: true,
    },
  });
});

// @desc    Create a return request
// @route   POST /api/returns
// @access  Private
export const createReturn = asyncHandler(async (req, res) => {
  const {
    orderId,
    items,
    reason,
    reasonDetail,
    type = 'return',
    preferredRefundMethod = 'original_payment',
    pickupAddress,
    pickupDate,
    pickupTimeSlot,
    images = [],
  } = req.body;
  
  // Validate order
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Validate order status
  if (order.status !== 'Delivered') {
    res.status(400);
    throw new Error('Only delivered orders can be returned');
  }
  
  // Check return window
  const deliveryDate = new Date(order.deliveredAt);
  const returnWindow = 30 * 24 * 60 * 60 * 1000;
  if (Date.now() - deliveryDate.getTime() > returnWindow) {
    res.status(400);
    throw new Error('Return window has expired');
  }
  
  // Check for existing return
  const existingReturn = await Return.findOne({
    order: orderId,
    status: { $nin: ['cancelled', 'rejected'] },
  });
  
  if (existingReturn) {
    res.status(400);
    throw new Error('A return request already exists for this order');
  }
  
  // Validate items
  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Please select items to return');
  }
  
  // Validate and build return items
  const returnItems = [];
  let totalRefundAmount = 0;
  
  for (const item of items) {
    const orderItem = order.orderItems.find(
      oi => oi.product.toString() === item.productId
    );
    
    if (!orderItem) {
      res.status(400);
      throw new Error(`Product ${item.productId} not found in order`);
    }
    
    if (item.quantity > orderItem.quantity) {
      res.status(400);
      throw new Error(`Cannot return more than ordered quantity for ${orderItem.name}`);
    }
    
    if (orderItem.returnStatus && orderItem.returnStatus !== 'none') {
      res.status(400);
      throw new Error(`${orderItem.name} already has a return status: ${orderItem.returnStatus}`);
    }
    
    returnItems.push({
      product: orderItem.product,
      name: orderItem.name,
      price: orderItem.price,
      quantity: item.quantity,
      image: orderItem.image,
      returnReason: item.returnReason || reason,
      itemCondition: item.itemCondition || 'unopened',
    });
    
    totalRefundAmount += orderItem.price * item.quantity;
  }
  
  // Calculate tax refund (proportional)
  const taxRefund = order.taxPrice 
    ? (order.taxPrice * totalRefundAmount / order.itemsPrice) 
    : 0;
  
  // Calculate total refund with tax
  const finalRefundAmount = totalRefundAmount + taxRefund;
  
  // Use order shipping address if pickup address not provided
  const returnPickupAddress = pickupAddress || order.shippingAddress;
  
  // Create return
  const returnRequest = await Return.create({
    order: orderId,
    user: req.user._id,
    items: returnItems,
    type,
    reason,
    reasonDetail,
    status: 'requested',
    statusHistory: [{
      status: 'requested',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: 'Return request submitted by customer',
      isCustomerVisible: true,
    }],
    shipping: {
      method: 'pickup',
      pickupAddress: returnPickupAddress,
      pickupDate: pickupDate ? new Date(pickupDate) : null,
      pickupTimeSlot,
    },
    refund: {
      amount: Math.round(finalRefundAmount * 100) / 100,
      method: preferredRefundMethod,
      status: 'pending',
      breakdown: {
        itemsTotal: Math.round(totalRefundAmount * 100) / 100,
        shippingRefund: 0,
        taxRefund: Math.round(taxRefund * 100) / 100,
        restockingFee: 0,
        adjustments: 0,
      },
    },
    images,
    priority: reason === 'damaged_defective' ? 'high' : 'normal',
    sla: {
      expectedApprovalBy: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      expectedCompletionBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
  
  // Update order items with return status
  for (const item of returnItems) {
    const orderItem = order.orderItems.find(
      oi => oi.product.toString() === item.product.toString()
    );
    if (orderItem) {
      orderItem.returnStatus = 'requested';
      orderItem.returnReason = item.returnReason;
      orderItem.returnRequestedAt = new Date();
    }
  }
  
  // Update order status
  order.status = 'Return Requested';
  order.returnRequest = {
    status: 'requested',
    returnId: returnRequest._id,
    reason: reasonDetail,
    requestedAt: new Date(),
    items: returnItems.map(item => ({
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    refundAmount: Math.round(finalRefundAmount * 100) / 100,
    refundStatus: 'pending',
  };
  
  order.statusHistory.push({
    status: 'Return Requested',
    changedAt: new Date(),
    changedBy: req.user._id,
    note: `Return request submitted: ${reasonDetail.substring(0, 100)}`,
  });
  
  await order.save();
  
  // Notify customer
  await Notification.create({
    user: req.user._id,
    type: 'info',
    title: 'Return Request Submitted',
    message: `Your return request #${returnRequest.returnNumber} has been submitted. We'll review it within 48 hours.`,
    link: `/returns/${returnRequest._id}`,
  });
  
  // Notify all admins
  await notifyAllAdmins({
    type: 'return_request',
    title: 'New Return Request',
    message: `Return request ${returnRequest.returnNumber} received for Order #${order.orderNumber}. Reason: ${RETURN_REASONS[reason]}`,
    link: `/admin/returns/${returnRequest._id}`,
    data: {
      returnId: returnRequest._id,
      orderId: order._id,
      refundAmount: finalRefundAmount,
    },
  });
  
  res.status(201).json({
    success: true,
    message: 'Return request submitted successfully',
    data: returnRequest,
  });
});

// @desc    Get user's returns
// @route   GET /api/returns/my-returns
// @access  Private
export const getMyReturns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;
  
  const query = { user: req.user._id };
  if (status) query.status = status;
  
  const [returns, total] = await Promise.all([
    Return.find(query)
      .populate('order', 'orderNumber totalPrice createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Return.countDocuments(query),
  ]);
  
  res.json({
    success: true,
    data: returns,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get return by ID
// @route   GET /api/returns/:id
// @access  Private
export const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate('order', 'orderNumber orderItems totalPrice itemsPrice shippingPrice taxPrice createdAt deliveredAt paymentInfo shippingAddress')
    .populate('user', 'name email')
    .populate('approvedBy', 'name')
    .populate('rejectedBy', 'name')
    .populate('refund.processedBy', 'name')
    .populate('statusHistory.changedBy', 'name')
    .populate('qualityCheck.checkedBy', 'name');
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  // Check ownership
  if (returnRequest.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Filter status history for non-admin users
  let filteredReturn = returnRequest.toObject();
  if (req.user.role !== 'admin') {
    filteredReturn.statusHistory = filteredReturn.statusHistory.filter(h => h.isCustomerVisible);
    delete filteredReturn.adminNotes;
  }
  
  res.json({
    success: true,
    data: filteredReturn,
  });
});

// @desc    Cancel return request
// @route   PUT /api/returns/:id/cancel
// @access  Private
export const cancelReturn = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  // Check ownership
  if (returnRequest.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Check if cancellable
  const cancellableStatuses = ['requested', 'pending_approval', 'approved'];
  if (!cancellableStatuses.includes(returnRequest.status)) {
    res.status(400);
    throw new Error(`Cannot cancel return with status: ${returnRequest.status}`);
  }
  
  const { reason } = req.body;
  
  // Update return status
  returnRequest.addStatusHistory('cancelled', req.user._id, reason || 'Cancelled by customer');
  await returnRequest.save();
  
  // Update order
  const order = await Order.findById(returnRequest.order);
  if (order) {
    // Reset item return statuses
    for (const returnItem of returnRequest.items) {
      const orderItem = order.orderItems.find(
        oi => oi.product.toString() === returnItem.product.toString()
      );
      if (orderItem) {
        orderItem.returnStatus = 'none';
        orderItem.returnReason = undefined;
        orderItem.returnRequestedAt = undefined;
      }
    }
    
    order.status = 'Delivered';
    order.returnRequest = {
      status: 'none',
      returnId: undefined,
    };
    order.statusHistory.push({
      status: 'Return Cancelled',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: reason || 'Return request cancelled',
    });
    await order.save();
  }
  
  res.json({
    success: true,
    message: 'Return request cancelled successfully',
    data: returnRequest,
  });
});

// @desc    Add message to return
// @route   POST /api/returns/:id/message
// @access  Private
export const addMessage = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  // Check ownership
  if (returnRequest.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  const { message } = req.body;
  
  if (!message || message.trim().length < 5) {
    res.status(400);
    throw new Error('Message must be at least 5 characters');
  }
  
  const sender = req.user.role === 'admin' ? 'admin' : 'customer';
  
  returnRequest.customerMessages.push({
    message: message.trim(),
    sender,
    senderId: req.user._id,
    sentAt: new Date(),
  });
  
  await returnRequest.save();
  
  // Notify the other party
  if (sender === 'customer') {
    await notifyAllAdmins({
      type: 'info',
      title: 'New Return Message',
      message: `Customer message on return ${returnRequest.returnNumber}`,
      link: `/admin/returns/${returnRequest._id}`,
    });
  } else {
    await Notification.create({
      user: returnRequest.user,
      type: 'info',
      title: 'Return Update',
      message: 'You have a new message regarding your return request',
      link: `/returns/${returnRequest._id}`,
    });
  }
  
  res.json({
    success: true,
    message: 'Message sent successfully',
    data: returnRequest.customerMessages[returnRequest.customerMessages.length - 1],
  });
});

// ==================== ADMIN ROUTES ====================

// @desc    Get all returns (admin)
// @route   GET /api/returns/admin/all
// @access  Private/Admin
export const getAllReturns = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    type,
    priority,
    startDate, 
    endDate,
    search,
  } = req.query;
  const skip = (page - 1) * limit;
  
  const query = {};
  
  if (status) query.status = status;
  if (type) query.type = type;
  if (priority) query.priority = priority;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  // Search by return number or order number
  if (search) {
    query.$or = [
      { returnNumber: { $regex: search, $options: 'i' } },
    ];
  }
  
  const [returns, total] = await Promise.all([
    Return.find(query)
      .populate('order', 'orderNumber totalPrice')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Return.countDocuments(query),
  ]);
  
  // Get status counts for dashboard
  const statusCounts = await Return.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  
  res.json({
    success: true,
    data: returns,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    total,
    statusCounts: statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  });
});

// @desc    Get return statistics (admin)
// @route   GET /api/returns/admin/stats
// @access  Private/Admin
export const getReturnStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
  
  // Get overall stats
  const [
    totalReturns,
    pendingReturns,
    completedReturns,
    totalRefunds,
    returnsByStatus,
    returnsByReason,
    dailyReturns,
    avgProcessingTime,
  ] = await Promise.all([
    Return.countDocuments({ createdAt: { $gte: startDate } }),
    Return.countDocuments({ 
      status: { $in: ['requested', 'pending_approval', 'approved', 'pickup_scheduled', 'in_transit', 'received', 'inspecting'] },
      createdAt: { $gte: startDate },
    }),
    Return.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: startDate },
    }),
    Return.aggregate([
      { 
        $match: { 
          'refund.status': 'completed',
          createdAt: { $gte: startDate },
        } 
      },
      { $group: { _id: null, total: { $sum: '$refund.amount' } } },
    ]),
    Return.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Return.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Return.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          refundAmount: { $sum: '$refund.amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Return.aggregate([
      { 
        $match: { 
          status: 'completed',
          completedAt: { $exists: true },
          createdAt: { $gte: startDate },
        } 
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
      { $group: { _id: null, avgDays: { $avg: '$processingTime' } } },
    ]),
  ]);
  
  // Calculate return rate
  const totalOrders = await Order.countDocuments({
    status: 'Delivered',
    createdAt: { $gte: startDate },
  });
  const returnRate = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
  
  res.json({
    success: true,
    data: {
      summary: {
        totalReturns,
        pendingReturns,
        completedReturns,
        totalRefunds: totalRefunds[0]?.total || 0,
        returnRate: Math.round(returnRate * 10) / 10,
        avgProcessingTime: avgProcessingTime[0]?.avgDays 
          ? Math.round(avgProcessingTime[0].avgDays * 10) / 10 
          : 0,
      },
      byStatus: returnsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byReason: returnsByReason.map(item => ({
        reason: item._id,
        reasonText: RETURN_REASONS[item._id] || item._id,
        count: item.count,
      })),
      dailyTrend: dailyReturns,
      period: { days: parseInt(days), startDate },
    },
  });
});

// @desc    Approve return request (admin)
// @route   PUT /api/returns/:id/approve
// @access  Private/Admin
export const approveReturn = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id).populate('order');
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  if (!['requested', 'pending_approval'].includes(returnRequest.status)) {
    res.status(400);
    throw new Error(`Cannot approve return with status: ${returnRequest.status}`);
  }
  
  const { 
    adminNote, 
    refundAmount, 
    pickupDate, 
    pickupTimeSlot,
    schedulePickup = true,
  } = req.body;
  
  // Update refund amount if provided
  if (refundAmount !== undefined) {
    returnRequest.refund.amount = refundAmount;
  }
  
  // Update return status
  const newStatus = schedulePickup ? 'pickup_scheduled' : 'approved';
  returnRequest.addStatusHistory(newStatus, req.user._id, adminNote || 'Return approved by admin');
  returnRequest.approvedAt = new Date();
  returnRequest.approvedBy = req.user._id;
  
  if (schedulePickup) {
    returnRequest.shipping.pickupDate = pickupDate ? new Date(pickupDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    returnRequest.shipping.pickupTimeSlot = pickupTimeSlot || '10:00 AM - 6:00 PM';
  }
  
  if (adminNote) {
    returnRequest.adminNotes.push({
      note: adminNote,
      addedBy: req.user._id,
      addedAt: new Date(),
    });
  }
  
  await returnRequest.save();
  
  // Update order status
  const order = await Order.findById(returnRequest.order._id);
  if (order) {
    order.returnRequest.status = newStatus;
    order.statusHistory.push({
      status: 'Return Approved',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: adminNote || 'Return request approved',
    });
    
    // Update item return statuses
    for (const returnItem of returnRequest.items) {
      const orderItem = order.orderItems.find(
        oi => oi.product.toString() === returnItem.product.toString()
      );
      if (orderItem) {
        orderItem.returnStatus = 'approved';
      }
    }
    
    await order.save();
  }
  
  // Notify customer
  await Notification.create({
    user: returnRequest.user,
    type: 'success',
    title: 'Return Approved! ✅',
    message: schedulePickup 
      ? `Your return #${returnRequest.returnNumber} has been approved. Pickup scheduled for ${returnRequest.shipping.pickupDate?.toLocaleDateString()}.`
      : `Your return #${returnRequest.returnNumber} has been approved. Please ship the item back.`,
    link: `/returns/${returnRequest._id}`,
  });
  
  res.json({
    success: true,
    message: 'Return approved successfully',
    data: returnRequest,
  });
});

// @desc    Reject return request (admin)
// @route   PUT /api/returns/:id/reject
// @access  Private/Admin
export const rejectReturn = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  if (!['requested', 'pending_approval'].includes(returnRequest.status)) {
    res.status(400);
    throw new Error(`Cannot reject return with status: ${returnRequest.status}`);
  }
  
  const { rejectionReason } = req.body;
  
  if (!rejectionReason || rejectionReason.trim().length < 20) {
    res.status(400);
    throw new Error('Please provide a detailed rejection reason (minimum 20 characters)');
  }
  
  // Update return status
  returnRequest.addStatusHistory('rejected', req.user._id, rejectionReason);
  returnRequest.rejectedAt = new Date();
  returnRequest.rejectedBy = req.user._id;
  returnRequest.rejectionReason = rejectionReason;
  returnRequest.refund.status = 'failed';
  returnRequest.refund.failureReason = rejectionReason;
  
  await returnRequest.save();
  
  // Update order
  const order = await Order.findById(returnRequest.order);
  if (order) {
    order.status = 'Delivered';
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectionReason = rejectionReason;
    
    // Reset item return statuses
    for (const returnItem of returnRequest.items) {
      const orderItem = order.orderItems.find(
        oi => oi.product.toString() === returnItem.product.toString()
      );
      if (orderItem) {
        orderItem.returnStatus = 'rejected';
      }
    }
    
    order.statusHistory.push({
      status: 'Return Rejected',
      changedAt: new Date(),
      changedBy: req.user._id,
      note: rejectionReason,
    });
    
    await order.save();
  }
  
  // Notify customer
  await Notification.create({
    user: returnRequest.user,
    type: 'error',
    title: 'Return Request Rejected',
    message: `Your return #${returnRequest.returnNumber} has been rejected. Reason: ${rejectionReason.substring(0, 100)}`,
    link: `/returns/${returnRequest._id}`,
  });
  
  res.json({
    success: true,
    message: 'Return rejected',
    data: returnRequest,
  });
});

// @desc    Update return status (admin)
// @route   PUT /api/returns/:id/status
// @access  Private/Admin
export const updateReturnStatus = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  const { status, note, trackingNumber, carrier } = req.body;
  
  const validStatuses = [
    'pending_approval', 'approved', 'pickup_scheduled', 'in_transit',
    'received', 'inspecting', 'inspection_passed', 'inspection_failed',
    'processing_refund', 'refund_completed', 'completed', 'cancelled',
  ];
  
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }
  
  // Update status
  returnRequest.addStatusHistory(status, req.user._id, note || `Status updated to ${status}`);
  
  // Handle specific status updates
  if (status === 'in_transit' && trackingNumber) {
    returnRequest.shipping.trackingNumber = trackingNumber;
    if (carrier) returnRequest.shipping.carrier = carrier;
  }
  
  if (status === 'received') {
    returnRequest.shipping.receivedAt = new Date();
    returnRequest.shipping.receivedBy = req.user._id;
  }
  
  if (status === 'completed') {
    returnRequest.completedAt = new Date();
  }
  
  await returnRequest.save();
  
  // Update order
  const order = await Order.findById(returnRequest.order);
  if (order) {
    if (status === 'completed') {
      order.status = 'Returned';
    }
    order.returnRequest.status = status;
    await order.save();
  }
  
  // Notify customer for important status changes
  const notifyStatuses = ['in_transit', 'received', 'inspection_passed', 'inspection_failed', 'completed'];
  if (notifyStatuses.includes(status)) {
    const statusMessages = {
      in_transit: 'Your returned item is on the way back to us.',
      received: 'We have received your returned item and will inspect it shortly.',
      inspection_passed: 'Your returned item passed inspection. Refund will be processed soon.',
      inspection_failed: 'Your returned item did not pass inspection. Please check your return details.',
      completed: 'Your return has been completed successfully!',
    };
    
    await Notification.create({
      user: returnRequest.user,
      type: status === 'inspection_failed' ? 'warning' : 'info',
      title: 'Return Status Update',
      message: statusMessages[status],
      link: `/returns/${returnRequest._id}`,
    });
  }
  
  res.json({
    success: true,
    message: 'Return status updated',
    data: returnRequest,
  });
});

// @desc    Process refund (admin)
// @route   PUT /api/returns/:id/refund
// @access  Private/Admin
export const processRefund = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id).populate('order');
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  if (returnRequest.refund.status === 'completed') {
    res.status(400);
    throw new Error('Refund has already been processed');
  }
  
  const { refundMethod, transactionId, note, adjustedAmount } = req.body;
  
  // Use adjusted amount if provided
  const finalRefundAmount = adjustedAmount !== undefined 
    ? adjustedAmount 
    : returnRequest.refund.amount;
  
  // Update refund status
  returnRequest.refund.status = 'processing';
  returnRequest.refund.method = refundMethod || returnRequest.refund.method;
  returnRequest.addStatusHistory('processing_refund', req.user._id, note || 'Processing refund');
  
  await returnRequest.save();
  
  // Simulate refund processing (in production, this would integrate with payment gateway)
  try {
    // Handle wallet refund
    if (refundMethod === 'wallet') {
      const user = await User.findById(returnRequest.user);
      user.walletBalance = (user.walletBalance || 0) + finalRefundAmount;
      if (!user.walletHistory) user.walletHistory = [];
      user.walletHistory.push({
        type: 'credit',
        amount: finalRefundAmount,
        description: `Refund for return #${returnRequest.returnNumber}`,
        returnId: returnRequest._id,
        createdAt: new Date(),
      });
      await user.save();
    }
    
    // Update refund as completed
    returnRequest.refund.status = 'completed';
    returnRequest.refund.amount = finalRefundAmount;
    returnRequest.refund.transactionId = transactionId || `REF-${Date.now()}`;
    returnRequest.refund.processedAt = new Date();
    returnRequest.refund.processedBy = req.user._id;
    returnRequest.addStatusHistory('refund_completed', req.user._id, `Refund of ₹${finalRefundAmount} processed via ${refundMethod || 'original payment method'}`);
    returnRequest.status = 'completed';
    returnRequest.completedAt = new Date();
    
    await returnRequest.save();
    
    // Update order
    const order = await Order.findById(returnRequest.order._id);
    if (order) {
      order.returnRequest.refundStatus = 'completed';
      order.returnRequest.processedAt = new Date();
      order.returnRequest.processedBy = req.user._id;
      order.status = 'Returned';
      
      // Update payment info for refund
      order.paymentInfo.status = returnRequest.items.length === order.orderItems.length 
        ? 'refunded' 
        : 'partial_refund';
      order.paymentInfo.refundedAmount = (order.paymentInfo.refundedAmount || 0) + finalRefundAmount;
      order.paymentInfo.refundedAt = new Date();
      
      // Update item statuses
      for (const returnItem of returnRequest.items) {
        const orderItem = order.orderItems.find(
          oi => oi.product.toString() === returnItem.product.toString()
        );
        if (orderItem) {
          orderItem.returnStatus = 'refunded';
          orderItem.returnProcessedAt = new Date();
        }
      }
      
      order.statusHistory.push({
        status: 'Refunded',
        changedAt: new Date(),
        changedBy: req.user._id,
        note: `Refund of ₹${finalRefundAmount} processed`,
      });
      
      await order.save();
      
      // Update revenue tracking
      await updateRevenueAfterRefund(order, finalRefundAmount, returnRequest._id);
      
      // Deduct loyalty points
      await deductLoyaltyPointsForReturn(
        returnRequest.user,
        order.itemsPrice,
        returnRequest._id,
        finalRefundAmount
      );
      
      // Restore product stock
      for (const item of returnRequest.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }
    
    // Notify customer
    await Notification.create({
      user: returnRequest.user,
      type: 'success',
      title: 'Refund Completed! 💰',
      message: `Your refund of ₹${finalRefundAmount} has been processed to your ${refundMethod === 'wallet' ? 'wallet' : 'original payment method'}.`,
      link: `/returns/${returnRequest._id}`,
    });
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: returnRequest,
    });
    
  } catch (error) {
    returnRequest.refund.status = 'failed';
    returnRequest.refund.failureReason = error.message;
    await returnRequest.save();
    
    throw new Error(`Failed to process refund: ${error.message}`);
  }
});

// @desc    Add admin note (admin)
// @route   POST /api/returns/:id/admin-note
// @access  Private/Admin
export const addAdminNote = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  const { note } = req.body;
  
  if (!note || note.trim().length < 5) {
    res.status(400);
    throw new Error('Note must be at least 5 characters');
  }
  
  returnRequest.adminNotes.push({
    note: note.trim(),
    addedBy: req.user._id,
    addedAt: new Date(),
  });
  
  await returnRequest.save();
  
  res.json({
    success: true,
    message: 'Note added successfully',
    data: returnRequest.adminNotes[returnRequest.adminNotes.length - 1],
  });
});

// @desc    Update quality check (admin)
// @route   PUT /api/returns/:id/quality-check
// @access  Private/Admin
export const updateQualityCheck = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id);
  
  if (!returnRequest) {
    res.status(404);
    throw new Error('Return not found');
  }
  
  const { passed, notes, issues = [] } = req.body;
  
  returnRequest.qualityCheck = {
    passed,
    checkedBy: req.user._id,
    checkedAt: new Date(),
    notes,
    issues,
  };
  
  const newStatus = passed ? 'inspection_passed' : 'inspection_failed';
  returnRequest.addStatusHistory(
    newStatus, 
    req.user._id, 
    notes || (passed ? 'Item passed quality inspection' : 'Item failed quality inspection')
  );
  
  await returnRequest.save();
  
  res.json({
    success: true,
    message: `Quality check ${passed ? 'passed' : 'failed'}`,
    data: returnRequest,
  });
});

// @desc    Get return constants
// @route   GET /api/returns/constants
// @access  Public
export const getReturnConstants = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      reasons: RETURN_REASONS,
      itemConditions: ITEM_CONDITIONS,
      refundMethods: {
        original_payment: 'Original Payment Method',
        wallet: 'Store Wallet',
        bank_transfer: 'Bank Transfer',
        store_credit: 'Store Credit',
      },
      returnTypes: {
        return: 'Return for Refund',
        exchange: 'Exchange',
        replacement: 'Replacement',
      },
      policies: {
        returnWindow: 30,
        freePickup: true,
        restockingFee: 0,
      },
    },
  });
});
