import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiEye, FiPackage } from 'react-icons/fi';
import { fetchMyOrders } from '../store/slices/orderSlice';
import { formatPrice, formatDate, getOrderStatusColor } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const ordersState = useSelector((state) => state.orders) || {};
  const { orders = [], isLoading = false } = ordersState;

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <FiPackage className="w-24 h-24 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
          <p className="text-gray-500 mb-8">
            You haven't placed any orders yet. Start shopping now!
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-primary-600">{formatPrice(order.totalPrice)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={getOrderStatusColor(order.status)}>
                  {order.status}
                </span>
                <Link
                  to={`/orders/${order._id}`}
                  className="btn-secondary text-sm flex items-center"
                >
                  <FiEye className="mr-2" /> View Details
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-4">
                {order.orderItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/50?text=Product';
                      }}
                    />
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.orderItems.length > 3 && (
                  <p className="text-sm text-gray-500 self-center">
                    +{order.orderItems.length - 3} more items
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
