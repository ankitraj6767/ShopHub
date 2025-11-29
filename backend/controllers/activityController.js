import asyncHandler from 'express-async-handler';
import UserActivity from '../models/UserActivity.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Track product view
// @route   POST /api/activity/view/:productId
// @access  Private
export const trackProductView = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({ user: userId });
  }

  // Update recently viewed
  const existingViewIndex = activity.recentlyViewed.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingViewIndex > -1) {
    // Update existing view
    activity.recentlyViewed[existingViewIndex].viewedAt = new Date();
    activity.recentlyViewed[existingViewIndex].viewCount += 1;
  } else {
    // Add new view (limit to 50 items)
    activity.recentlyViewed.unshift({
      product: productId,
      viewedAt: new Date(),
      viewCount: 1,
    });
    if (activity.recentlyViewed.length > 50) {
      activity.recentlyViewed.pop();
    }
  }

  // Update category preferences
  const categoryIndex = activity.categoryPreferences.findIndex(
    (pref) => pref.category === product.category
  );
  if (categoryIndex > -1) {
    activity.categoryPreferences[categoryIndex].score += 1;
    activity.categoryPreferences[categoryIndex].lastInteraction = new Date();
  } else {
    activity.categoryPreferences.push({
      category: product.category,
      score: 1,
      lastInteraction: new Date(),
    });
  }

  // Update brand preferences
  const brandIndex = activity.brandPreferences.findIndex(
    (pref) => pref.brand === product.brand
  );
  if (brandIndex > -1) {
    activity.brandPreferences[brandIndex].score += 1;
    activity.brandPreferences[brandIndex].lastInteraction = new Date();
  } else {
    activity.brandPreferences.push({
      brand: product.brand,
      score: 1,
      lastInteraction: new Date(),
    });
  }

  // Update price preference average
  const viewedProducts = activity.recentlyViewed.length;
  activity.pricePreference.average =
    (activity.pricePreference.average * (viewedProducts - 1) + product.price) / viewedProducts;

  await activity.save();

  res.json({ success: true });
});

// @desc    Get recently viewed products
// @route   GET /api/activity/recently-viewed
// @access  Private
export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 10;

  const activity = await UserActivity.findOne({ user: userId }).populate({
    path: 'recentlyViewed.product',
    select: 'name price images rating numReviews stock category brand',
  });

  if (!activity) {
    return res.json([]);
  }

  const recentlyViewed = activity.recentlyViewed
    .filter((item) => item.product) // Filter out deleted products
    .slice(0, limit)
    .map((item) => ({
      ...item.product.toObject(),
      viewedAt: item.viewedAt,
      viewCount: item.viewCount,
    }));

  res.json(recentlyViewed);
});

// @desc    Get personalized recommendations
// @route   GET /api/activity/recommendations
// @access  Private
export const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 12;

  const activity = await UserActivity.findOne({ user: userId });

  let recommendations = [];

  if (activity) {
    // Get top categories and brands
    const topCategories = activity.categoryPreferences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p) => p.category);

    const topBrands = activity.brandPreferences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((p) => p.brand);

    const viewedProductIds = activity.recentlyViewed.map((v) => v.product);

    // Get products based on preferences, excluding already viewed
    recommendations = await Product.find({
      $and: [
        { _id: { $nin: viewedProductIds } },
        {
          $or: [
            { category: { $in: topCategories } },
            { brand: { $in: topBrands } },
          ],
        },
        { stock: { $gt: 0 } },
      ],
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit)
      .select('name price images rating numReviews stock category brand');
  }

  // If no personalized recommendations, get trending products
  if (recommendations.length < limit) {
    const trendingProducts = await Product.find({
      _id: { $nin: recommendations.map((r) => r._id) },
      stock: { $gt: 0 },
    })
      .sort({ numReviews: -1, rating: -1 })
      .limit(limit - recommendations.length)
      .select('name price images rating numReviews stock category brand');

    recommendations = [...recommendations, ...trendingProducts];
  }

  res.json(recommendations);
});

// @desc    Track search query
// @route   POST /api/activity/search
// @access  Private
export const trackSearch = asyncHandler(async (req, res) => {
  const { query, resultsCount } = req.body;
  const userId = req.user._id;

  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({ user: userId });
  }

  // Add search to history (limit to 100)
  activity.searchHistory.unshift({
    query,
    searchedAt: new Date(),
    resultsCount: resultsCount || 0,
  });

  if (activity.searchHistory.length > 100) {
    activity.searchHistory = activity.searchHistory.slice(0, 100);
  }

  await activity.save();

  res.json({ success: true });
});

// @desc    Get search suggestions based on history
// @route   GET /api/activity/search-suggestions
// @access  Private
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userId = req.user._id;

  const activity = await UserActivity.findOne({ user: userId });

  let suggestions = [];

  if (activity && q) {
    // Get matching searches from history
    const matchingSearches = activity.searchHistory
      .filter((s) => s.query.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map((s) => ({ type: 'history', text: s.query }));

    suggestions = [...matchingSearches];
  }

  // Get product name suggestions
  if (q) {
    const productSuggestions = await Product.find({
      name: { $regex: q, $options: 'i' },
      stock: { $gt: 0 },
    })
      .limit(5)
      .select('name category');

    productSuggestions.forEach((p) => {
      suggestions.push({ type: 'product', text: p.name, category: p.category });
    });

    // Get category suggestions
    const categories = [
      'Electronics',
      'Clothing',
      'Home & Garden',
      'Sports & Outdoors',
      'Books',
      'Toys & Games',
      'Health & Beauty',
      'Automotive',
      'Food & Grocery',
    ];

    const matchingCategories = categories
      .filter((c) => c.toLowerCase().includes(q.toLowerCase()))
      .map((c) => ({ type: 'category', text: c }));

    suggestions = [...suggestions, ...matchingCategories];
  }

  // Remove duplicates
  const uniqueSuggestions = suggestions.reduce((acc, current) => {
    const x = acc.find((item) => item.text.toLowerCase() === current.text.toLowerCase());
    if (!x) {
      return acc.concat([current]);
    }
    return acc;
  }, []);

  res.json(uniqueSuggestions.slice(0, 10));
});

// @desc    Get quick buy list (frequently purchased)
// @route   GET /api/activity/quick-buy
// @access  Private
export const getQuickBuyList = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get user's orders and calculate frequently purchased items
  const orders = await Order.find({ user: userId, 'paymentInfo.status': 'paid' })
    .sort({ createdAt: -1 })
    .limit(50);

  const productFrequency = {};

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const productId = item.product.toString();
      if (productFrequency[productId]) {
        productFrequency[productId].count += item.quantity;
        if (new Date(order.createdAt) > productFrequency[productId].lastPurchased) {
          productFrequency[productId].lastPurchased = order.createdAt;
        }
      } else {
        productFrequency[productId] = {
          productId,
          count: item.quantity,
          lastPurchased: order.createdAt,
        };
      }
    });
  });

  // Sort by frequency and get top 10
  const sortedProducts = Object.values(productFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Populate product details
  const productIds = sortedProducts.map((p) => p.productId);
  const products = await Product.find({ _id: { $in: productIds }, stock: { $gt: 0 } })
    .select('name price images rating stock category brand');

  const quickBuyList = sortedProducts
    .map((freq) => {
      const product = products.find((p) => p._id.toString() === freq.productId);
      if (product) {
        return {
          ...product.toObject(),
          purchaseCount: freq.count,
          lastPurchased: freq.lastPurchased,
        };
      }
      return null;
    })
    .filter(Boolean);

  res.json(quickBuyList);
});

// @desc    Save cart as template
// @route   POST /api/activity/save-cart
// @access  Private
export const saveCartTemplate = asyncHandler(async (req, res) => {
  const { name, items } = req.body;
  const userId = req.user._id;

  if (!name || !items || items.length === 0) {
    res.status(400);
    throw new Error('Please provide cart name and items');
  }

  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({ user: userId });
  }

  // Limit to 10 saved carts
  if (activity.savedCarts.length >= 10) {
    activity.savedCarts.pop();
  }

  activity.savedCarts.unshift({
    name,
    items: items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    })),
  });

  await activity.save();

  res.status(201).json({ message: 'Cart saved successfully' });
});

// @desc    Get saved cart templates
// @route   GET /api/activity/saved-carts
// @access  Private
export const getSavedCarts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const activity = await UserActivity.findOne({ user: userId }).populate({
    path: 'savedCarts.items.product',
    select: 'name price images stock',
  });

  if (!activity) {
    return res.json([]);
  }

  res.json(activity.savedCarts);
});

// @desc    Delete saved cart template
// @route   DELETE /api/activity/saved-carts/:cartId
// @access  Private
export const deleteSavedCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const userId = req.user._id;

  const activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  activity.savedCarts = activity.savedCarts.filter(
    (cart) => cart._id.toString() !== cartId
  );

  await activity.save();

  res.json({ message: 'Cart deleted successfully' });
});

// @desc    Create price drop alert
// @route   POST /api/activity/price-alert
// @access  Private
export const createPriceAlert = asyncHandler(async (req, res) => {
  const { productId, targetPrice } = req.body;
  const userId = req.user._id;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  let activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    activity = await UserActivity.create({ user: userId });
  }

  // Check if alert already exists
  const existingAlert = activity.priceAlerts.find(
    (alert) => alert.product.toString() === productId && alert.isActive
  );

  if (existingAlert) {
    existingAlert.targetPrice = targetPrice;
    existingAlert.originalPrice = product.price;
  } else {
    activity.priceAlerts.push({
      product: productId,
      originalPrice: product.price,
      targetPrice: targetPrice || product.price * 0.9, // Default 10% off
      isActive: true,
    });
  }

  await activity.save();

  res.status(201).json({ message: 'Price alert created successfully' });
});

// @desc    Get price alerts
// @route   GET /api/activity/price-alerts
// @access  Private
export const getPriceAlerts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const activity = await UserActivity.findOne({ user: userId }).populate({
    path: 'priceAlerts.product',
    select: 'name price images stock',
  });

  if (!activity) {
    return res.json([]);
  }

  const alerts = activity.priceAlerts
    .filter((alert) => alert.product && alert.isActive)
    .map((alert) => ({
      _id: alert._id,
      product: alert.product,
      originalPrice: alert.originalPrice,
      targetPrice: alert.targetPrice,
      currentPrice: alert.product.price,
      priceDrop: alert.originalPrice - alert.product.price,
      isTriggered: alert.product.price <= alert.targetPrice,
      createdAt: alert.createdAt,
    }));

  res.json(alerts);
});

// @desc    Delete price alert
// @route   DELETE /api/activity/price-alert/:alertId
// @access  Private
export const deletePriceAlert = asyncHandler(async (req, res) => {
  const { alertId } = req.params;
  const userId = req.user._id;

  const activity = await UserActivity.findOne({ user: userId });

  if (!activity) {
    res.status(404);
    throw new Error('Activity not found');
  }

  const alertIndex = activity.priceAlerts.findIndex(
    (alert) => alert._id.toString() === alertId
  );

  if (alertIndex > -1) {
    activity.priceAlerts[alertIndex].isActive = false;
    await activity.save();
  }

  res.json({ message: 'Price alert removed' });
});

// @desc    Get user dashboard summary
// @route   GET /api/activity/dashboard
// @access  Private
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [activity, recentOrders, pendingOrders] = await Promise.all([
    UserActivity.findOne({ user: userId }),
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalPrice status createdAt'),
    Order.countDocuments({
      user: userId,
      status: { $in: ['Processing', 'Shipped'] },
    }),
  ]);

  // Calculate savings from orders
  const orders = await Order.find({ user: userId, 'paymentInfo.status': 'paid' });
  const totalSavings = orders.reduce(
    (sum, order) => sum + (order.discountAmount || 0) + (order.premiumDiscount || 0),
    0
  );

  // Get triggered price alerts
  let triggeredAlerts = [];
  if (activity) {
    const alertsWithProducts = await UserActivity.findOne({ user: userId }).populate({
      path: 'priceAlerts.product',
      select: 'name price images',
    });

    triggeredAlerts = alertsWithProducts.priceAlerts
      .filter((alert) => alert.product && alert.isActive && alert.product.price <= alert.targetPrice)
      .slice(0, 3);
  }

  res.json({
    recentOrders,
    pendingOrders,
    totalSavings,
    recentlyViewedCount: activity?.recentlyViewed?.length || 0,
    savedCartsCount: activity?.savedCarts?.length || 0,
    priceAlertsCount: activity?.priceAlerts?.filter((a) => a.isActive).length || 0,
    triggeredAlerts,
    topCategories: activity?.categoryPreferences
      ?.sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((c) => c.category) || [],
  });
});

// @desc    Check and notify users about triggered price alerts
// @route   POST /api/activity/check-price-alerts (Admin only or cron job)
// @access  Private/Admin
export const checkAllPriceAlerts = asyncHandler(async (req, res) => {
  const Notification = (await import('../models/Notification.js')).default;
  
  // Find all users with active price alerts
  const activitiesWithAlerts = await UserActivity.find({
    'priceAlerts.isActive': true,
  }).populate({
    path: 'priceAlerts.product',
    select: 'name price images',
  });

  let notificationsSent = 0;

  for (const activity of activitiesWithAlerts) {
    for (const alert of activity.priceAlerts) {
      // Skip if already notified or not active
      if (!alert.isActive || alert.notifiedAt || !alert.product) continue;

      // Check if price has dropped to or below target
      if (alert.product.price <= alert.targetPrice) {
        // Create notification for this specific user
        await Notification.create({
          user: activity.user,
          type: 'price_drop',
          title: `Price Drop Alert! 💰`,
          message: `Great news! ${alert.product.name} has dropped to ₹${alert.product.price} - below your target of ₹${alert.targetPrice}!`,
          link: `/products/${alert.product._id}`,
          data: {
            productId: alert.product._id,
            oldPrice: alert.originalPrice,
            newPrice: alert.product.price,
            targetPrice: alert.targetPrice,
          },
        });

        // Mark as notified
        alert.notifiedAt = new Date();
        notificationsSent++;
      }
    }
    await activity.save();
  }

  res.json({
    success: true,
    message: `Checked all price alerts. Sent ${notificationsSent} notifications.`,
  });
});
