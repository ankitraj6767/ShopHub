import asyncHandler from 'express-async-handler';
import StockAlert from '../models/StockAlert.js';
import Product from '../models/Product.js';

// @desc    Subscribe to stock alert
// @route   POST /api/stock-alerts
// @access  Private
export const subscribeStockAlert = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.stock > 0) {
    res.status(400);
    throw new Error('Product is already in stock');
  }

  // Check if already subscribed
  const existing = await StockAlert.findOne({
    user: req.user._id,
    product: productId,
  });

  if (existing) {
    res.status(400);
    throw new Error('Already subscribed to stock alerts for this product');
  }

  const alert = await StockAlert.create({
    user: req.user._id,
    product: productId,
    email: req.user.email,
  });

  res.status(201).json({
    success: true,
    message: 'Successfully subscribed to stock alerts',
    data: alert,
  });
});

// @desc    Unsubscribe from stock alert
// @route   DELETE /api/stock-alerts/:productId
// @access  Private
export const unsubscribeStockAlert = asyncHandler(async (req, res) => {
  const alert = await StockAlert.findOneAndDelete({
    user: req.user._id,
    product: req.params.productId,
  });

  if (!alert) {
    res.status(404);
    throw new Error('Stock alert subscription not found');
  }

  res.json({
    success: true,
    message: 'Successfully unsubscribed from stock alerts',
  });
});

// @desc    Check if subscribed to stock alert
// @route   GET /api/stock-alerts/check/:productId
// @access  Private
export const checkStockAlert = asyncHandler(async (req, res) => {
  const alert = await StockAlert.findOne({
    user: req.user._id,
    product: req.params.productId,
  });

  res.json({
    success: true,
    isSubscribed: !!alert,
  });
});

// @desc    Get my stock alerts
// @route   GET /api/stock-alerts/my
// @access  Private
export const getMyStockAlerts = asyncHandler(async (req, res) => {
  const alerts = await StockAlert.find({ user: req.user._id })
    .populate('product', 'name images price stock')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: alerts,
  });
});

// @desc    Notify users when product is back in stock (called internally)
// @route   Internal function
export const notifyStockAlerts = async (productId) => {
  try {
    const alerts = await StockAlert.find({
      product: productId,
      isNotified: false,
    }).populate('user', 'email name');

    // Here you would send emails to each user
    // For now, just mark them as notified
    for (const alert of alerts) {
      alert.isNotified = true;
      alert.notifiedAt = new Date();
      await alert.save();
      
      // TODO: Send email notification
      console.log(`Stock alert notification sent to ${alert.email} for product ${productId}`);
    }

    return alerts.length;
  } catch (error) {
    console.error('Error sending stock alerts:', error);
    return 0;
  }
};
