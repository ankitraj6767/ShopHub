import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiShoppingBag,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiArrowRight
} from 'react-icons/fi';
import { fetchAdminStats } from '../../store/slices/orderSlice';
import { fetchProducts } from '../../store/slices/productSlice';
import { fetchAllUsers } from '../../store/slices/userSlice';
import { formatPrice, formatDate, getOrderStatusColor } from '../../utils/helpers';
import Spinner from '../../components/ui/Spinner';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { adminStats, isLoading: ordersLoading } = useSelector((state) => state.orders);
  const { products } = useSelector((state) => state.products);
  const { users, isLoading: usersLoading } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchProducts({ limit: 5 }));
    dispatch(fetchAllUsers({ limit: 5 }));
  }, [dispatch]);

  if (ordersLoading || usersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(adminStats?.totalRevenue || 0),
      icon: FiDollarSign,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Total Orders',
      value: adminStats?.totalOrders || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      change: '+8.2%'
    },
    {
      title: 'Total Products',
      value: products?.length || 0,
      icon: FiPackage,
      color: 'bg-purple-500',
      change: '+3.1%'
    },
    {
      title: 'Total Users',
      value: users?.length || 0,
      icon: FiUsers,
      color: 'bg-orange-500',
      change: '+15.3%'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {formatDate(new Date())}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-500 text-sm flex items-center">
                <FiTrendingUp className="mr-1" /> {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
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
                <div key={order._id} className="flex items-center justify-between pb-4 border-b last:border-0">
                  <div>
                    <p className="font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.totalPrice)}</p>
                    <span className={`text-sm ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
            <Link
              to="/admin/products"
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              View All <FiArrowRight className="ml-1" />
            </Link>
          </div>
          {products && products.length > 0 ? (
            <div className="space-y-4">
              {products.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  <img
                    src={product.images?.[0] || 'https://via.placeholder.com/50'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/50?text=Product';
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(product.price)}</p>
                    <p className="text-sm text-gray-500">{product.stock} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products yet</p>
          )}
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Pending', 'Paid', 'Shipped', 'Delivered'].map((status) => (
            <div key={status} className="text-center p-4 rounded-lg bg-gray-50">
              <p className="text-3xl font-bold text-gray-900">
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
