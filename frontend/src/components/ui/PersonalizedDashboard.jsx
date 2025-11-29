import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPackage,
  FiTruck,
  FiHeart,
  FiSave,
  FiBell,
  FiGift,
  FiTrendingDown,
  FiArrowRight,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';
import { fetchDashboardSummary } from '../../store/slices/activitySlice';
import { formatPrice } from '../../utils/helpers';

const PersonalizedDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardSummary, dashboardLoading } = useSelector((state) => state.activity);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDashboardSummary());
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (dashboardLoading) {
    return (
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!dashboardSummary) {
    return null;
  }

  const quickLinks = [
    {
      icon: FiPackage,
      label: 'Pending Orders',
      value: dashboardSummary.pendingOrders,
      color: 'bg-blue-500',
      link: '/orders',
    },
    {
      icon: FiDollarSign,
      label: 'Total Savings',
      value: formatPrice(dashboardSummary.totalSavings),
      color: 'bg-green-500',
      link: '/orders',
    },
    {
      icon: FiClock,
      label: 'Recently Viewed',
      value: dashboardSummary.recentlyViewedCount,
      color: 'bg-purple-500',
      link: '/products',
    },
    {
      icon: FiSave,
      label: 'Saved Carts',
      value: dashboardSummary.savedCartsCount,
      color: 'bg-orange-500',
      link: '/saved-carts',
    },
  ];

  return (
    <section className="py-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your account
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.link}
                className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`${item.color} p-2 rounded-lg`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Triggered Price Alerts */}
        {dashboardSummary.triggeredAlerts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 mb-8 text-white"
          >
            <div className="flex items-center gap-3 mb-4">
              <FiTrendingDown className="w-6 h-6" />
              <h3 className="text-xl font-bold">Price Drop Alert! 🎉</h3>
            </div>
            <p className="mb-4 opacity-90">
              Great news! Prices have dropped on items you're watching
            </p>
            <div className="flex flex-wrap gap-3">
              {dashboardSummary.triggeredAlerts.map((alert) => (
                <Link
                  key={alert._id}
                  to={`/products/${alert.product._id}`}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                >
                  <img
                    src={alert.product.images?.[0]?.url || '/placeholder.jpg'}
                    alt={alert.product.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{alert.product.name}</p>
                    <p className="text-xs opacity-90">
                      Now {formatPrice(alert.product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              to="/price-alerts"
              className="inline-flex items-center gap-2 mt-4 text-white/90 hover:text-white font-medium"
            >
              View all price alerts
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Recent Orders */}
        {dashboardSummary.recentOrders?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiPackage className="text-primary-500" />
                Recent Orders
              </h3>
              <Link
                to="/orders"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1"
              >
                View all <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {dashboardSummary.recentOrders.slice(0, 3).map((order) => (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(order.totalPrice)}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'Delivered'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : order.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Categories */}
        {dashboardSummary.topCategories?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Your favorite categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {dashboardSummary.topCategories.map((category, index) => (
                <Link
                  key={index}
                  to={`/products?category=${encodeURIComponent(category)}`}
                  className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PersonalizedDashboard;
