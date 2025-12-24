import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiCheckCircle,
  FiClock
} from 'react-icons/fi';
import { fetchAdminStats } from '../../store/slices/orderSlice';
import { formatPrice, formatDate, getOrderStatusColor } from '../../utils/helpers';
import Spinner from '../../components/ui/Spinner';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { adminStats, isLoading: ordersLoading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  if (ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Helper to format percentage change
  const formatChange = (value) => {
    if (value === undefined || value === null) return { text: '0%', isPositive: true };
    const isPositive = value >= 0;
    const text = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
    return { text, isPositive };
  };

  const revenueChange = formatChange(adminStats?.revenueChange);
  const collectedRevenueChange = formatChange(adminStats?.collectedRevenueChange);
  const ordersChange = formatChange(adminStats?.ordersChange);
  const productsChange = formatChange(adminStats?.productsChange);
  const usersChange = formatChange(adminStats?.usersChange);

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(adminStats?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-green-500',
      change: revenueChange.text,
      isPositive: revenueChange.isPositive,
      subtitle: 'All orders'
    },
    {
      title: 'Collected Revenue',
      value: formatPrice(adminStats?.collectedRevenue || 0),
      icon: FiCheckCircle,
      color: 'bg-emerald-600',
      change: collectedRevenueChange.text,
      isPositive: collectedRevenueChange.isPositive,
      subtitle: 'Paid orders only'
    },
    {
      title: 'Pending Revenue',
      value: formatPrice(adminStats?.pendingRevenue || 0),
      icon: FiClock,
      color: 'bg-yellow-500',
      change: null,
      isPositive: true,
      subtitle: 'COD orders awaiting delivery'
    },
    {
      title: 'Total Orders',
      value: adminStats?.totalOrders || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      change: ordersChange.text,
      isPositive: ordersChange.isPositive,
      subtitle: 'vs last 30 days'
    },
    {
      title: 'Total Products',
      value: adminStats?.totalProducts || 0,
      icon: FiPackage,
      color: 'bg-purple-500',
      change: productsChange.text,
      isPositive: productsChange.isPositive,
      subtitle: 'vs last 30 days'
    },
    {
      title: 'Total Users',
      value: adminStats?.totalUsers || 0,
      icon: FiUsers,
      color: 'bg-orange-500',
      change: usersChange.text,
      isPositive: usersChange.isPositive,
      subtitle: 'vs last 30 days'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {formatDate(new Date())}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change && (
                <span className={`${stat.isPositive ? 'text-green-500' : 'text-red-500'} text-sm flex items-center`}>
                  {stat.isPositive ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          {adminStats?.recentOrders && adminStats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {adminStats.recentOrders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex items-center justify-between pb-4 border-b dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium dark:text-white">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium dark:text-white">{formatPrice(order.totalPrice)}</p>
                    <span className={`text-sm ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
            <Link
              to="/admin/products"
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          {adminStats?.topProducts && adminStats.topProducts.length > 0 ? (
            <div className="space-y-4">
              {adminStats.topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id || index} className="flex items-center gap-4 pb-4 border-b dark:border-gray-700 last:border-0">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1 dark:text-white">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{product.totalSold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{formatPrice(product.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Order Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered'].map((status) => (
            <div key={status} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {adminStats?.ordersByStatus?.[status] || 0}
              </p>
              <p className={`text-sm ${getOrderStatusColor(status)}`}>{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
