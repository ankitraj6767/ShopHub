import { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiEye,
  FiStar,
  FiCalendar,
  FiRefreshCw,
  FiAlertCircle,
  FiBox
} from 'react-icons/fi';
import api from '../../utils/api';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/helpers';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/analytics/dashboard?days=${dateRange}`);
      
      if (response.data.success) {
        setAnalytics(response.data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load analytics';
      // Check for auth errors
      if (error.response?.status === 401) {
        setError('Please login to view analytics');
      } else if (error.response?.status === 403) {
        setError('Admin access required to view analytics');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (isLoading && !analytics) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Loading analytics...</span>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          <FiRefreshCw className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const charts = analytics?.charts || {};
  const topProducts = analytics?.topProducts || [];
  const recentOrders = analytics?.recentOrders || [];

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(summary.totalRevenue || 0),
      change: summary.revenueChange || 0,
      icon: FiDollarSign,
      color: 'bg-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Total Orders',
      value: summary.totalOrders || 0,
      change: summary.orderChange || 0,
      icon: FiShoppingCart,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Avg Order Value',
      value: formatPrice(summary.avgOrderValue || 0),
      change: summary.aovChange || 0,
      icon: FiPackage,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'New Customers',
      value: summary.newUsers || 0,
      change: summary.userGrowth || 0,
      icon: FiUsers,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const performanceMetrics = [
    {
      title: 'Conversion Rate',
      value: `${summary.conversionRate || 0}%`,
      icon: FiEye,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Returning Customers',
      value: `${summary.returningCustomerRate || 0}%`,
      icon: FiUsers,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Avg Product Rating',
      value: (summary.avgProductRating || 0).toFixed(1),
      icon: FiStar,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      subtitle: `${summary.totalReviews || 0} reviews`,
    },
    {
      title: 'Total Customers',
      value: summary.totalUsers || 0,
      icon: FiCalendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  const statusColors = {
    Pending: 'bg-yellow-500',
    Paid: 'bg-blue-500',
    Processing: 'bg-purple-500',
    Shipped: 'bg-indigo-500',
    Delivered: 'bg-green-500',
    Cancelled: 'bg-red-500',
  };

  const dailyRevenue = charts.dailyRevenue || [];
  const statusCounts = charts.orderStatusDistribution || {};
  const categoryPerformance = charts.categoryPerformance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-outline flex items-center gap-2"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm flex items-center font-medium ${
                stat.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change >= 0 ? (
                  <FiTrendingUp className="mr-1" />
                ) : (
                  <FiTrendingDown className="mr-1" />
                )}
                {Math.abs(stat.change).toFixed(1)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Stock Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
            <FiBox className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalProducts || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
            <FiAlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.lowStockProducts || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock Items</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
            <FiAlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.outOfStockProducts || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h2>
          {dailyRevenue.length > 0 ? (
            <div className="relative">
              {/* Chart Container */}
              <div className="h-48 sm:h-56 md:h-64 flex items-end justify-between gap-0.5 sm:gap-1 px-1">
                {dailyRevenue.slice(-7).map((day, idx) => {
                  const visibleData = dailyRevenue.slice(-7);
                  const maxRevenue = Math.max(...visibleData.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group">
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-primary-600 to-primary-400 rounded-t hover:from-primary-700 hover:to-primary-500 transition-all duration-200 cursor-pointer relative"
                        style={{ 
                          height: `${Math.max(height, 3)}%`,
                          minHeight: '6px'
                        }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs py-1.5 px-2.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-30 pointer-events-none">
                          <div className="font-medium">{formatPrice(day.revenue)}</div>
                          <div className="text-gray-300 text-[10px]">{day.orders} orders</div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Date Labels */}
              <div className="flex justify-between gap-0.5 sm:gap-1 mt-3 px-1 border-t border-gray-100 dark:border-gray-700 pt-2">
                {dailyRevenue.slice(-7).map((day, idx) => (
                  <div key={idx} className="flex-1 text-center overflow-hidden">
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 block">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 block">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FiTrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No revenue data for this period</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status Distribution</h2>
          <div className="space-y-3 sm:space-y-4">
            {Object.entries(statusCounts).length > 0 ? (
              Object.entries(statusCounts).map(([status, count]) => {
                const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
                const percentage = total ? (count / total * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300 capitalize">{status}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${statusColors[status] || 'bg-gray-500'} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No order data for this period
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id || idx} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.quantity} sold</p>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                    {formatPrice(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.title} className={`p-4 ${metric.bgColor} rounded-lg text-center`}>
                <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</p>
                {metric.subtitle && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{metric.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Order #</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Customer</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 text-sm text-gray-900 dark:text-white font-medium">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{order.customer}</td>
                    <td className="py-3 text-sm text-gray-900 dark:text-white font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        order.status === 'Processing' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent orders</p>
        )}
      </div>

      {/* Category Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h2>
        {categoryPerformance.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categoryPerformance.slice(0, 10).map((cat) => {
              const emoji = {
                'Electronics': '📱',
                'Clothing': '👕',
                'Home & Garden': '🏠',
                'Sports & Outdoors': '⚽',
                'Books': '📚',
                'Toys & Games': '🎮',
                'Health & Beauty': '💄',
                'Automotive': '🚗',
                'Food & Grocery': '🍎',
              }[cat.category] || '📦';
              
              return (
                <div key={cat.category} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{cat.category}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(cat.revenue)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{cat.quantity} items sold</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No category data available</p>
        )}
      </div>

      {/* Payment Methods */}
      {charts.paymentMethodDistribution?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {charts.paymentMethodDistribution.map((method) => (
              <div key={method.method} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-2xl mb-1">
                  {method.method === 'stripe' ? '💳' : method.method === 'cod' ? '💵' : method.method === 'paypal' ? '🅿️' : '💰'}
                </p>
                <p className="font-medium text-gray-900 dark:text-white text-sm capitalize">
                  {method.method === 'cod' ? 'Cash on Delivery' : method.method}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{method.count} orders</p>
                <p className="text-xs text-green-600 dark:text-green-400">{formatPrice(method.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
