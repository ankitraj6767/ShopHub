import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiArrowLeft,
  FiTruck,
  FiPackage,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { fetchOrder, updateOrderStatus } from '../../store/slices/orderSlice';
import { formatPrice, formatDate, formatDateTime, getOrderStatusColor } from '../../utils/helpers';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order, isLoading } = useSelector((state) => state.orders);

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
  });
  const [updating, setUpdating] = useState(false);

  const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const carriers = ['FedEx', 'UPS', 'USPS', 'DHL', 'Amazon Logistics', 'Other'];

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (order) {
      setTrackingForm({
        carrier: order.carrier || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        estimatedDelivery: order.estimatedDelivery
          ? new Date(order.estimatedDelivery).toISOString().split('T')[0]
          : '',
      });
    }
  }, [order]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await dispatch(updateOrderStatus({ orderId: id, status: newStatus })).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateTracking = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/tracking`, trackingForm);
      toast.success('Tracking information updated');
      dispatch(fetchOrder(id));
      setShowTrackingModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update tracking');
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading || !order) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/orders"
        className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className={`rounded-lg px-4 py-2 font-medium ${getOrderStatusColor(order.status)}`}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowTrackingModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiTruck /> Update Tracking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiPackage className="mr-2" /> Order Items ({order.orderItems.length})
            </h2>
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=Product';
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-medium dark:text-white">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiClock className="mr-2" /> Order Timeline
            </h2>
            <div className="space-y-4">
              {order.statusHistory?.length > 0 ? (
                order.statusHistory.map((history, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {history.status === 'Delivered' ? (
                        <FiCheckCircle />
                      ) : history.status === 'Cancelled' ? (
                        <FiXCircle />
                      ) : (
                        <FiClock />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{history.status}</p>
                      {history.note && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{history.note}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDateTime(history.changedAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary-600 text-white">
                    <FiClock />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{order.status}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm p-6">
              <h2 className="font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
                <FiTruck className="mr-2" /> Tracking Information
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-blue-400 font-medium">Carrier</p>
                  <p className="text-blue-900 dark:text-blue-200">{order.carrier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-400 font-medium">Tracking Number</p>
                  <p className="text-blue-900 dark:text-blue-200">{order.trackingNumber}</p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-blue-700 dark:text-blue-400 font-medium">Estimated Delivery</p>
                    <p className="text-blue-900 dark:text-blue-200">{formatDate(order.estimatedDelivery)}</p>
                  </div>
                )}
                {order.trackingUrl && (
                  <div>
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Track Package →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiUser className="mr-2" /> Customer
            </h2>
            <p className="font-medium dark:text-white">{order.user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{order.user?.email}</p>
          </div>

          {/* Shipping Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiMapPin className="mr-2" /> Shipping Address
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && (
                <>
                  <br />
                  Phone: {order.shippingAddress.phone}
                </>
              )}
            </p>
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FiCreditCard className="mr-2" /> Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="dark:text-white">{order.paymentInfo.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <span
                  className={
                    order.paymentInfo.status === 'paid'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }
                >
                  {order.paymentInfo.status}
                </span>
              </div>
              {order.paymentInfo.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Paid At</span>
                  <span className="dark:text-white">{formatDate(order.paymentInfo.paidAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="dark:text-white">{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                <span className="dark:text-white">
                  {order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tax</span>
                <span className="dark:text-white">{formatPrice(order.taxPrice)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-700">
                <span className="dark:text-white">Total</span>
                <span className="text-primary-600">{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Update Tracking Information</h3>
            <form onSubmit={handleUpdateTracking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Carrier
                </label>
                <select
                  value={trackingForm.carrier}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, carrier: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select Carrier</option>
                  {carriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Number *
                </label>
                <input
                  type="text"
                  value={trackingForm.trackingNumber}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })
                  }
                  className="input"
                  placeholder="Enter tracking number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking URL
                </label>
                <input
                  type="url"
                  value={trackingForm.trackingUrl}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })
                  }
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Delivery
                </label>
                <input
                  type="date"
                  value={trackingForm.estimatedDelivery}
                  onChange={(e) =>
                    setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })
                  }
                  className="input"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1"
                >
                  {updating ? <Spinner size="sm" /> : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetail;
