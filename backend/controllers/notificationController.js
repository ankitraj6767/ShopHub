import Notification from '../models/Notification.js';
import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ user: req.user._id });
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notifications'
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// @desc    Create notification (internal use or admin)
// @route   POST /api/notifications
// @access  Private/Admin
export const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, link, data } = req.body;

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      data
    });

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Helper function to create notifications (for internal use)
export const createUserNotification = async (userId, { type, title, message, link, data }) => {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      data
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper function to notify all users (for new products, offers, etc.)
export const notifyAllUsers = async ({ type, title, message, link, data }) => {
  try {
    const users = await User.find({ isActive: { $ne: false } }).select('_id');
    const notifications = users.map(user => ({
      user: user._id,
      type,
      title,
      message,
      link,
      data,
      read: false
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications for all users`);
    }
  } catch (error) {
    console.error('Failed to notify all users:', error);
  }
};

// Helper function to notify specific user about order status
export const notifyOrderStatus = async (userId, order, status) => {
  try {
    let title, message, type;
    const orderNumber = order._id.toString().slice(-8).toUpperCase();
    
    switch (status) {
      case 'Shipped':
        type = 'delivery';
        title = 'Order Shipped! 🚚';
        message = `Your order #${orderNumber} has been shipped and is on its way!`;
        break;
      case 'Delivered':
        type = 'delivery';
        title = 'Order Delivered! 📦';
        message = `Your order #${orderNumber} has been delivered. Enjoy your purchase!`;
        break;
      case 'Paid':
        type = 'order';
        title = 'Payment Confirmed ✓';
        message = `Payment for order #${orderNumber} has been confirmed. We're preparing your order!`;
        break;
      case 'Cancelled':
        type = 'order';
        title = 'Order Cancelled';
        message = `Your order #${orderNumber} has been cancelled.`;
        break;
      default:
        type = 'order';
        title = 'Order Update';
        message = `Your order #${orderNumber} status has been updated to: ${status}`;
    }

    await Notification.create({
      user: userId,
      type,
      title,
      message,
      link: `/orders/${order._id}`,
      data: { orderId: order._id, status }
    });
  } catch (error) {
    console.error('Failed to create order notification:', error);
  }
};

// Helper function to notify about new coupon
export const notifyNewCoupon = async (coupon) => {
  try {
    const discountText = coupon.discountType === 'percentage' 
      ? `${coupon.discountValue}% off` 
      : `₹${coupon.discountValue} off`;
    
    await notifyAllUsers({
      type: 'promo',
      title: `New Coupon: ${coupon.code} 🎉`,
      message: `Use code ${coupon.code} to get ${discountText}! ${coupon.description || ''}`.trim(),
      link: '/products',
      data: { couponCode: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }
    });
  } catch (error) {
    console.error('Failed to notify about new coupon:', error);
  }
};

// Helper function to notify about new product
export const notifyNewProduct = async (product) => {
  try {
    await notifyAllUsers({
      type: 'system',
      title: `New Arrival: ${product.name} ✨`,
      message: `Check out our new ${product.category} - ${product.name} now available for ₹${product.price}!`,
      link: `/products/${product._id}`,
      data: { productId: product._id, productName: product.name }
    });
  } catch (error) {
    console.error('Failed to notify about new product:', error);
  }
};

// Helper function to notify about price drop - ONLY to users who have set price alerts
export const notifyPriceDrop = async (product, oldPrice, newPrice) => {
  try {
    const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
    
    // Find all users who have active price alerts for this product
    // and whose target price is >= the new price
    const usersWithAlerts = await UserActivity.find({
      'priceAlerts.product': product._id,
      'priceAlerts.isActive': true,
      'priceAlerts.targetPrice': { $gte: newPrice }
    }).select('user priceAlerts');

    // Filter to get only users whose alert for this specific product is triggered
    const usersToNotify = [];
    for (const activity of usersWithAlerts) {
      const alert = activity.priceAlerts.find(
        (a) => a.product.toString() === product._id.toString() && 
               a.isActive && 
               a.targetPrice >= newPrice
      );
      if (alert) {
        usersToNotify.push({
          userId: activity.user,
          targetPrice: alert.targetPrice,
          originalPrice: alert.originalPrice
        });
        
        // Mark the alert as notified
        alert.notifiedAt = new Date();
        await activity.save();
      }
    }

    // Create notifications only for users who set alerts
    if (usersToNotify.length > 0) {
      const notifications = usersToNotify.map((userAlert) => ({
        user: userAlert.userId,
        type: 'price_drop',
        title: `Price Drop Alert! 💰`,
        message: `Great news! ${product.name} has dropped to ₹${newPrice} - below your target of ₹${userAlert.targetPrice}!`,
        link: `/products/${product._id}`,
        data: { 
          productId: product._id, 
          oldPrice: userAlert.originalPrice, 
          newPrice, 
          targetPrice: userAlert.targetPrice,
          discount 
        }
      }));

      await Notification.insertMany(notifications);
      console.log(`Price drop notifications sent to ${usersToNotify.length} users for ${product.name}`);
    }
  } catch (error) {
    console.error('Failed to notify about price drop:', error);
  }
};

// Helper function to notify about back in stock
export const notifyBackInStock = async (product) => {
  try {
    await notifyAllUsers({
      type: 'back_in_stock',
      title: `Back in Stock! 🔔`,
      message: `${product.name} is back in stock! Grab yours before it's gone!`,
      link: `/products/${product._id}`,
      data: { productId: product._id, productName: product.name }
    });
  } catch (error) {
    console.error('Failed to notify about back in stock:', error);
  }
};
