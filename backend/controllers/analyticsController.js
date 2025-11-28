import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import asyncHandler from 'express-async-handler';

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const daysNum = parseInt(days);
  
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - daysNum * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - daysNum * 24 * 60 * 60 * 1000);

  // Current period orders - no populate needed, orderItems stores name directly
  const currentOrders = await Order.find({
    createdAt: { $gte: currentPeriodStart }
  });

  // Previous period orders
  const previousOrders = await Order.find({
    createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
  });

  // Total revenue calculations
  const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  const revenueChange = previousRevenue ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : (totalRevenue > 0 ? 100 : 0);

  // Order count
  const totalOrders = currentOrders.length;
  const previousOrderCount = previousOrders.length;
  const orderChange = previousOrderCount ? ((totalOrders - previousOrderCount) / previousOrderCount * 100) : (totalOrders > 0 ? 100 : 0);

  // Average order value
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const previousAvgOrderValue = previousOrderCount ? previousRevenue / previousOrderCount : 0;
  const aovChange = previousAvgOrderValue ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue * 100) : (avgOrderValue > 0 ? 100 : 0);

  // User analytics
  const totalUsers = await User.countDocuments();
  const newUsers = await User.countDocuments({
    createdAt: { $gte: currentPeriodStart }
  });
  const previousNewUsers = await User.countDocuments({
    createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart }
  });
  const userGrowth = previousNewUsers ? ((newUsers - previousNewUsers) / previousNewUsers * 100) : (newUsers > 0 ? 100 : 0);

  // Daily revenue for chart
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Daily orders for chart
  const dailyOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Order status distribution
  const orderStatusDistribution = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Top selling products
  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        quantity: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Category performance
  const categoryPerformance = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$productInfo.category',
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        quantity: { $sum: '$orderItems.quantity' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // Payment method distribution
  const paymentMethodDistribution = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: currentPeriodStart }
      }
    },
    {
      $group: {
        _id: '$paymentInfo.method',
        count: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    }
  ]);

  // Returning customers calculation
  const customerOrderCounts = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 }
      }
    }
  ]);
  const returningCustomers = customerOrderCounts.filter(c => c.orderCount > 1).length;
  const totalCustomersWithOrders = customerOrderCounts.length;
  const returningCustomerRate = totalCustomersWithOrders ? (returningCustomers / totalCustomersWithOrders * 100) : 0;

  // Average product rating
  const ratingStats = await Review.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  const avgProductRating = ratingStats[0]?.avgRating || 0;
  const totalReviews = ratingStats[0]?.totalReviews || 0;

  // Products stats
  const totalProducts = await Product.countDocuments({ isActive: true });
  const lowStockProducts = await Product.countDocuments({ 
    isActive: true, 
    stock: { $lte: 10, $gt: 0 } 
  });
  const outOfStockProducts = await Product.countDocuments({ 
    isActive: true, 
    stock: 0 
  });

  // Recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .select('orderNumber totalPrice status createdAt');

  // Conversion rate (users who made at least one order / total users)
  const usersWithOrders = await Order.distinct('user');
  const conversionRate = totalUsers ? (usersWithOrders.length / totalUsers * 100) : 0;

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalOrders,
        orderChange: Math.round(orderChange * 10) / 10,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        aovChange: Math.round(aovChange * 10) / 10,
        newUsers,
        userGrowth: Math.round(userGrowth * 10) / 10,
        totalUsers,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        conversionRate: Math.round(conversionRate * 10) / 10,
        returningCustomerRate: Math.round(returningCustomerRate * 10) / 10,
        avgProductRating: Math.round(avgProductRating * 10) / 10,
        totalReviews
      },
      charts: {
        dailyRevenue: dailyRevenue.map(d => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders
        })),
        dailyOrders: dailyOrders.map(d => ({
          date: d._id,
          count: d.count
        })),
        orderStatusDistribution: orderStatusDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        categoryPerformance: categoryPerformance.filter(c => c._id).map(c => ({
          category: c._id,
          revenue: c.revenue,
          quantity: c.quantity,
          orders: c.orders
        })),
        paymentMethodDistribution: paymentMethodDistribution.map(p => ({
          method: p._id || 'Unknown',
          count: p.count,
          revenue: p.revenue
        }))
      },
      topProducts: topProducts.map(p => ({
        id: p._id,
        name: p.name || 'Unknown Product',
        quantity: p.quantity,
        revenue: p.revenue
      })),
      recentOrders: recentOrders.map(o => ({
        id: o._id,
        orderNumber: o.orderNumber,
        customer: o.user?.name || 'Guest',
        total: o.totalPrice,
        status: o.status,
        date: o.createdAt
      })),
      period: {
        days: daysNum,
        startDate: currentPeriodStart,
        endDate: now
      }
    }
  });
});

// @desc    Get revenue breakdown
// @route   GET /api/analytics/revenue
// @access  Private/Admin
export const getRevenueBreakdown = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const revenueByPaymentStatus = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$paymentInfo.status',
        total: { $sum: '$totalPrice' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        revenue: m.revenue,
        orders: m.orders
      })),
      revenueByPaymentStatus
    }
  });
});

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private/Admin
export const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const newUsersOverTime = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const topCustomers = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$totalPrice' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' }
  ]);

  const lifetimeValueDistribution = await Order.aggregate([
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$totalPrice' }
      }
    },
    {
      $bucket: {
        groupBy: '$totalSpent',
        boundaries: [0, 50, 100, 200, 500, 1000, 5000],
        default: '5000+',
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      newUsersOverTime: newUsersOverTime.map(d => ({
        date: d._id,
        count: d.count
      })),
      topCustomers: topCustomers.map(c => ({
        id: c._id,
        name: c.userInfo?.name || 'Unknown',
        email: c.userInfo?.email,
        totalSpent: c.totalSpent,
        orderCount: c.orderCount
      })),
      lifetimeValueDistribution
    }
  });
});

// @desc    Get product analytics
// @route   GET /api/analytics/products
// @access  Private/Admin
export const getProductAnalytics = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const bestSellers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalQuantity: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 }
  ]);

  const lowPerformers = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        name: { $first: '$orderItems.name' },
        totalQuantity: { $sum: '$orderItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalQuantity: 1 } },
    { $limit: 10 }
  ]);

  const productsByRating = await Product.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $bucket: {
        groupBy: '$rating',
        boundaries: [0, 1, 2, 3, 4, 5],
        default: 'unrated',
        output: {
          count: { $sum: 1 },
          products: { $push: '$name' }
        }
      }
    }
  ]);

  const stockStatus = await Product.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$stock', 0] },
            'Out of Stock',
            {
              $cond: [
                { $lte: ['$stock', 10] },
                'Low Stock',
                'In Stock'
              ]
            }
          ]
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      bestSellers,
      lowPerformers,
      productsByRating,
      stockStatus: stockStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});

export default {
  getDashboardAnalytics,
  getRevenueBreakdown,
  getCustomerAnalytics,
  getProductAnalytics
};
