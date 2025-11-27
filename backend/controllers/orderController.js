import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { sendEmail, emailTemplates } from '../utils/email.js';
import User from '../models/User.js';
import { generateInvoicePDF } from '../utils/pdf.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentInfo } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // Validate and get product details
  const itemsWithDetails = [];
  let itemsPrice = 0;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }

    if (!product.isActive) {
      res.status(400);
      throw new Error(`Product is not available: ${product.name}`);
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
    }

    itemsWithDetails.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0]?.url || '/images/placeholder.jpg',
    });

    itemsPrice += product.price * item.quantity;
  }

  // Calculate prices
  const taxRate = 0.08; // 8% tax
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2));
  const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping over $100
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2));

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems: itemsWithDetails,
    shippingAddress,
    paymentInfo: {
      method: paymentInfo.method,
      status: 'unpaid',
    },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    status: 'Pending',
  });

  // Decrease stock for each product
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Send order confirmation email
  try {
    const emailContent = emailTemplates.orderConfirmation(order, req.user);
    await sendEmail({
      to: req.user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't fail the order if email fails
  }

  res.status(201).json({
    success: true,
    data: order,
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json({
      success: true,
      data: order,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const count = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized');
    }

    order.paymentInfo.status = 'paid';
    order.paymentInfo.paidAt = Date.now();
    order.paymentInfo.transactionId = req.body.transactionId || `TXN-${Date.now()}`;
    order.status = 'Paid';

    const updatedOrder = await order.save();

    res.json({
      success: true,
      data: updatedOrder,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = {};

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by payment status
  if (req.query.paymentStatus) {
    query['paymentInfo.status'] = req.query.paymentStatus;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Calculate stats
  const stats = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        avgOrderValue: { $avg: '$totalPrice' },
      },
    },
  ]);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
    stats: stats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    const { status, trackingNumber } = req.body;

    if (!['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status');
    }

    // Handle cancellation - restore stock
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'Delivered') {
      order.deliveredAt = Date.now();
    }

    if (status === 'Paid' && order.paymentInfo.status !== 'paid') {
      order.paymentInfo.status = 'paid';
      order.paymentInfo.paidAt = Date.now();
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    const updatedOrder = await order.save();

    // Send status update emails
    try {
      if (status === 'Shipped' && previousStatus !== 'Shipped') {
        const emailContent = emailTemplates.orderShipped(order, order.user, trackingNumber);
        await sendEmail({
          to: order.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } else if (status === 'Delivered' && previousStatus !== 'Delivered') {
        const emailContent = emailTemplates.orderDelivered(order, order.user);
        await sendEmail({
          to: order.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      }
    } catch (emailError) {
      console.error('Failed to send order status email:', emailError);
    }

    res.json({
      success: true,
      data: updatedOrder,
    });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get order statistics (admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = asyncHandler(async (req, res) => {
  // Orders by status
  const ordersByStatus = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total: { $sum: '$totalPrice' },
      },
    },
  ]);

  // Orders by month (last 12 months)
  const ordersByMonth = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Recent orders
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  // Top selling products
  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalSold: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  res.json({
    success: true,
    data: {
      ordersByStatus,
      ordersByMonth,
      recentOrders,
      topProducts,
    },
  });
});

// @desc    Cancel order (user)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['Pending', 'Paid', 'Processing'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error(`Cannot cancel order with status: ${order.status}. Order can only be cancelled when Pending, Paid, or Processing.`);
  }

  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error('Please provide a reason for cancellation (minimum 10 characters)');
  }

  // Restore stock for each item
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  // Update order status
  order.status = 'Cancelled';
  order.cancellation = {
    reason: reason.trim(),
    cancelledAt: new Date(),
    cancelledBy: req.user._id,
    refundAmount: order.totalPrice,
    refundStatus: order.paymentInfo.status === 'paid' ? 'pending' : 'not_applicable',
  };

  // Add to status history
  order.statusHistory.push({
    status: 'Cancelled',
    note: `Cancelled by ${req.user.role === 'admin' ? 'admin' : 'customer'}: ${reason}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
});

// @desc    Request return for order
// @route   POST /api/orders/:id/return
// @access  Private
export const requestReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to request return for this order');
  }

  // Check if order is delivered
  if (order.status !== 'Delivered') {
    res.status(400);
    throw new Error('Only delivered orders can be returned');
  }

  // Check if already has a return request
  if (order.returnRequest && order.returnRequest.status) {
    res.status(400);
    throw new Error(`Return request already exists with status: ${order.returnRequest.status}`);
  }

  // Check return window (30 days from delivery)
  const deliveryDate = new Date(order.deliveredAt);
  const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  if (Date.now() - deliveryDate.getTime() > returnWindow) {
    res.status(400);
    throw new Error('Return window has expired. Returns must be requested within 30 days of delivery.');
  }

  const { reason, items } = req.body;

  if (!reason || reason.trim().length < 20) {
    res.status(400);
    throw new Error('Please provide a detailed reason for return (minimum 20 characters)');
  }

  // Calculate refund amount (can be partial if specific items are returned)
  let refundAmount = order.totalPrice;
  let returnItems = order.orderItems;

  if (items && items.length > 0) {
    // Partial return
    returnItems = [];
    refundAmount = 0;

    for (const returnItem of items) {
      const orderItem = order.orderItems.find(
        (oi) => oi.product.toString() === returnItem.productId
      );

      if (!orderItem) {
        res.status(400);
        throw new Error(`Product ${returnItem.productId} not found in order`);
      }

      if (returnItem.quantity > orderItem.quantity) {
        res.status(400);
        throw new Error(`Cannot return more than ordered quantity for ${orderItem.name}`);
      }

      returnItems.push({
        product: orderItem.product,
        name: orderItem.name,
        quantity: returnItem.quantity,
        price: orderItem.price,
      });

      refundAmount += orderItem.price * returnItem.quantity;
    }
  }

  order.returnRequest = {
    status: 'requested',
    reason: reason.trim(),
    requestedAt: new Date(),
    items: returnItems,
    refundAmount,
  };

  // Add to status history
  order.statusHistory.push({
    status: 'Return Requested',
    note: `Return requested by customer: ${reason}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Return request submitted successfully',
    data: order,
  });
});

// @desc    Process return request (admin)
// @route   PUT /api/orders/:id/return/process
// @access  Private/Admin
export const processReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!order.returnRequest || !order.returnRequest.status) {
    res.status(400);
    throw new Error('No return request found for this order');
  }

  if (order.returnRequest.status !== 'requested') {
    res.status(400);
    throw new Error(`Cannot process return with status: ${order.returnRequest.status}`);
  }

  const { action, adminNote, refundAmount } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    res.status(400);
    throw new Error('Action must be either "approve" or "reject"');
  }

  if (action === 'approve') {
    // Restore stock for returned items
    const returnItems = order.returnRequest.items || order.orderItems;
    for (const item of returnItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.returnRequest.status = 'approved';
    order.returnRequest.refundAmount = refundAmount || order.returnRequest.refundAmount;
    order.returnRequest.refundStatus = 'pending';
    order.status = 'Returned';

    order.statusHistory.push({
      status: 'Return Approved',
      note: adminNote || 'Return request approved by admin',
      updatedBy: req.user._id,
    });
  } else {
    order.returnRequest.status = 'rejected';
    order.returnRequest.rejectionReason = adminNote || 'Return request rejected';

    order.statusHistory.push({
      status: 'Return Rejected',
      note: adminNote || 'Return request rejected by admin',
      updatedBy: req.user._id,
    });
  }

  order.returnRequest.processedAt = new Date();
  order.returnRequest.processedBy = req.user._id;

  await order.save();

  res.json({
    success: true,
    message: `Return request ${action}d successfully`,
    data: order,
  });
});

// @desc    Update tracking info (admin)
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
export const updateTracking = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const { carrier, trackingNumber, trackingUrl, estimatedDelivery } = req.body;

  if (carrier) order.carrier = carrier;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  // If tracking number is added and order is paid, update to shipped
  if (trackingNumber && order.status === 'Paid') {
    order.status = 'Shipped';
    order.shippedAt = new Date();

    order.statusHistory.push({
      status: 'Shipped',
      note: `Order shipped via ${carrier}. Tracking: ${trackingNumber}`,
      updatedBy: req.user._id,
    });
  }

  await order.save();

  res.json({
    success: true,
    message: 'Tracking information updated',
    data: order,
  });
});

// @desc    Get orders with return requests (admin)
// @route   GET /api/orders/returns
// @access  Private/Admin
export const getReturnRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {
    'returnRequest.status': { $exists: true },
  };

  // Filter by return status
  if (req.query.status) {
    query['returnRequest.status'] = req.query.status;
  }

  const count = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .populate('returnRequest.processedBy', 'name')
    .sort({ 'returnRequest.requestedAt': -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: orders,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Process refund (admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
export const processRefund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }


  // Check if order is cancelled or returned
  if (!['Cancelled', 'Returned'].includes(order.status)) {
    res.status(400);
    throw new Error('Only cancelled or returned orders can be refunded');
  }

  // Determine which refund to process
  let refundData;
  if (order.status === 'Cancelled' && order.cancellation) {
    refundData = order.cancellation;
  } else if (order.status === 'Returned' && order.returnRequest) {
    refundData = order.returnRequest;
  } else {
    res.status(400);
    throw new Error('No refund information found');
  }

  if (refundData.refundStatus === 'completed') {
    res.status(400);
    throw new Error('Refund has already been processed');
  }

  const { refundMethod, transactionId, note } = req.body;

  refundData.refundStatus = 'completed';
  refundData.refundedAt = new Date();
  refundData.refundMethod = refundMethod || 'original_payment_method';
  refundData.refundTransactionId = transactionId;

  order.statusHistory.push({
    status: 'Refunded',
    note: note || `Refund of $${refundData.refundAmount} processed via ${refundMethod || 'original payment method'}`,
    updatedBy: req.user._id,
  });

  await order.save();

  res.json({
    success: true,
    message: 'Refund processed successfully',
    data: order,
  });
});

// @desc    Download order invoice as PDF
// @route   GET /api/orders/:id/invoice
// @access  Private
export const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this invoice');
  }

  try {
    const pdfBuffer = await generateInvoicePDF(order, order.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500);
    throw new Error('Failed to generate invoice PDF');
  }
});
