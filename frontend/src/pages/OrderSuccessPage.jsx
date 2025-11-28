import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiCheck, FiPackage, FiMail, FiStar, FiGift } from 'react-icons/fi';
import { fetchOrder } from '../store/slices/orderSlice';
import { formatPrice, formatDate } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, isLoading, loyaltyPoints, referralCompleted } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 text-lg">
          Thank you for your order. We've received your order and will begin processing it soon.
        </p>
      </div>

      {/* Loyalty Points Earned */}
      {loyaltyPoints && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <FiStar className="w-7 h-7" />
              </div>
              <div>
                <p className="text-white/80 text-sm">You earned</p>
                <p className="text-3xl font-bold">{loyaltyPoints.totalPoints} Points</p>
                {loyaltyPoints.bonusPoints > 0 && (
                  <p className="text-sm text-white/80">
                    Includes {loyaltyPoints.bonusPoints} tier bonus points!
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/loyalty"
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              View Rewards
            </Link>
          </div>
        </div>
      )}

      {/* Referral Completed */}
      {referralCompleted && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <FiGift className="w-7 h-7" />
            </div>
            <div>
              <p className="text-lg font-medium">🎉 First Order Bonus!</p>
              <p className="text-white/80">
                Your referrer earned {referralCompleted.referrerReward} bonus points thanks to you!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="font-bold text-lg">#{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
            <p className="text-gray-600">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Payment Method</h3>
            <p className="text-gray-600">{order.paymentInfo.method}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
              order.paymentInfo.status === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.paymentInfo.status === 'paid' ? 'Paid' : 'Pending Payment'}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.orderItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100?text=Product';
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t mt-6 pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.itemsPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatPrice(order.taxPrice)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to={`/orders/${order._id}`} className="btn-primary flex items-center justify-center">
          <FiPackage className="mr-2" /> View Order Details
        </Link>
        <Link to="/products" className="btn-secondary flex items-center justify-center">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
