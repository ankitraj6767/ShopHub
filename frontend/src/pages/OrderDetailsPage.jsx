import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiX, FiRefreshCw, FiTruck, FiDownload } from 'react-icons/fi';
import { fetchOrder, cancelOrder, requestReturn, clearSuccess } from '../store/slices/orderSlice';
import { formatPrice, formatDate, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import api from '../utils/api';

const OrderDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ordersState = useSelector((state) => state.orders) || {};
  const { 
    order = null, 
    isLoading = false, 
    cancelSuccess = false, 
    returnSuccess = false, 
    error = null 
  } = ordersState;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (cancelSuccess) {
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      dispatch(clearSuccess());
    }
    if (returnSuccess) {
      toast.success('Return request submitted successfully');
      setShowReturnModal(false);
      setReturnReason('');
      dispatch(clearSuccess());
    }
  }, [cancelSuccess, returnSuccess, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCancelOrder = () => {
    if (cancelReason.length < 10) {
      toast.error('Please provide a reason (minimum 10 characters)');
      return;
    }
    dispatch(cancelOrder({ orderId: id, reason: cancelReason }));
  };

  const handleRequestReturn = () => {
    if (returnReason.length < 20) {
      toast.error('Please provide a detailed reason (minimum 20 characters)');
      return;
    }
    dispatch(requestReturn({ orderId: id, reason: returnReason }));
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/orders/${id}/invoice`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber || id.slice(-8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const canCancel = order && ['Pending', 'Paid', 'Processing'].includes(order.status);
  // Allow return if delivered and no return request exists (or status is 'none')
  const hasActiveReturn = order?.returnRequest?.status && order.returnRequest.status !== 'none';
  const canReturn = order && order.status === 'Delivered' && !hasActiveReturn;
  // Check if within 30-day return window, default to true if deliveredAt is not set (for backward compatibility)
  const isWithinReturnWindow = (() => {
    if (!order?.deliveredAt) return true;
    try {
      const deliveredDate = new Date(order.deliveredAt);
      if (isNaN(deliveredDate.getTime())) return true;
      return (Date.now() - deliveredDate.getTime()) < (30 * 24 * 60 * 60 * 1000);
    } catch {
      return true;
    }
  })();
  
  // Calculate days remaining for return
  const daysRemainingForReturn = (() => {
    if (!order?.deliveredAt) return 30;
    try {
      const deliveredDate = new Date(order.deliveredAt);
      if (isNaN(deliveredDate.getTime())) return 30;
      const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, 30 - daysSinceDelivery);
    } catch {
      return 30;
    }
  })();

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const orderSteps = ['Pending', 'Paid', 'Shipped', 'Delivered'];
  const currentStep = orderSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/orders/${id}/tracking`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FiTruck className="w-4 h-4" />
            Track Order
          </Link>
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <FiDownload className="w-4 h-4" />
            Download Invoice
          </button>
          <span className={`text-lg ${getOrderStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Progress */}
      {order.status !== 'Cancelled' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Order Progress</h2>
          <div className="relative">
            <div className="flex justify-between">
              {orderSteps.map((step, index) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      index <= currentStep
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`mt-2 text-sm ${
                    index <= currentStep ? 'text-primary-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(currentStep / (orderSteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Shipping Address</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
            {order.shippingAddress.phone && (
              <>
                <br />
                Phone: {order.shippingAddress.phone}
              </>
            )}
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            <span className="font-medium">Method:</span> {order.paymentInfo.method}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-medium">Status:</span>{' '}
            <span className={getPaymentStatusColor(order.paymentInfo.status)}>
              {order.paymentInfo.status.charAt(0).toUpperCase() + order.paymentInfo.status.slice(1)}
            </span>
          </p>
          {order.paymentInfo.paidAt && (
            <p className="text-gray-600">
              <span className="font-medium">Paid at:</span> {formatDateTime(order.paymentInfo.paidAt)}
            </p>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.orderItems.map((item, index) => (
            <div key={index} className="flex items-center gap-4 pb-4 border-b dark:border-gray-700 last:border-0 last:pb-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/100?text=Product';
                }}
              />
              <div className="flex-1">
                <Link
                  to={`/products/${item.product}`}
                  className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-white">{formatPrice(order.itemsPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Shipping</span>
            <span className="text-gray-900 dark:text-white">{order.shippingPrice === 0 ? 'Free' : formatPrice(order.shippingPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tax</span>
            <span className="text-gray-900 dark:text-white">{formatPrice(order.taxPrice)}</span>
          </div>
          {(order.discountApplied > 0 || order.discountAmount > 0) && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-{formatPrice(order.discountApplied || order.discountAmount)}</span>
            </div>
          )}
          {order.walletAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Wallet Payment</span>
              <span>-{formatPrice(order.walletAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary-600">{formatPrice(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <FiTruck className="mr-2" /> Tracking Information
          </h2>
          <div className="space-y-2 text-gray-600">
            {order.carrier && (
              <p><span className="font-medium">Carrier:</span> {order.carrier}</p>
            )}
            <p><span className="font-medium">Tracking Number:</span> {order.trackingNumber}</p>
            {order.estimatedDelivery && (
              <p><span className="font-medium">Estimated Delivery:</span> {formatDate(order.estimatedDelivery)}</p>
            )}
            {order.trackingUrl && (
              <a 
                href={order.trackingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 text-primary-600 hover:underline"
              >
                Track Package →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Info */}
      {order.status === 'Cancelled' && order.cancellationReason && (
        <div className="bg-red-50 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-red-800 mb-4">Order Cancelled</h2>
          <p className="text-red-700 mb-2"><span className="font-medium">Reason:</span> {order.cancellationReason}</p>
          {order.cancelledAt && (
            <p className="text-red-700 mb-2"><span className="font-medium">Cancelled At:</span> {formatDateTime(order.cancelledAt)}</p>
          )}
          {order.paymentInfo?.status === 'refunded' && (
            <p className="text-red-700"><span className="font-medium">Refund Status:</span> Refunded</p>
          )}
        </div>
      )}

      {/* Return Request Info */}
      {order.returnRequest?.status && order.returnRequest.status !== 'none' && (
        <div className={`rounded-lg shadow-sm p-6 mb-6 ${
          order.returnRequest.status === 'approved' || order.returnRequest.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20' :
          order.returnRequest.status === 'rejected' || order.returnRequest.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
        }`}>
          <h2 className={`font-semibold mb-4 ${
            order.returnRequest.status === 'approved' || order.returnRequest.status === 'completed' ? 'text-green-800 dark:text-green-400' :
            order.returnRequest.status === 'rejected' || order.returnRequest.status === 'cancelled' ? 'text-red-800 dark:text-red-400' : 'text-yellow-800 dark:text-yellow-400'
          }`}>
            Return Request - {order.returnRequest.status.charAt(0).toUpperCase() + order.returnRequest.status.slice(1).replace(/_/g, ' ')}
          </h2>
          {order.returnRequest.reason && (
            <p className="mb-2 text-gray-700 dark:text-gray-300"><span className="font-medium">Reason:</span> {order.returnRequest.reason}</p>
          )}
          {order.returnRequest.requestedAt && (
            <p className="mb-2 text-gray-700 dark:text-gray-300"><span className="font-medium">Requested At:</span> {formatDateTime(order.returnRequest.requestedAt)}</p>
          )}
          {order.returnRequest.processedAt && (
            <p className="mb-2 text-gray-700 dark:text-gray-300"><span className="font-medium">Processed At:</span> {formatDateTime(order.returnRequest.processedAt)}</p>
          )}
          {order.returnRequest.refundAmount > 0 && (
            <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Refund Amount:</span> {formatPrice(order.returnRequest.refundAmount)}</p>
          )}
          {order.returnRequest.returnId && (
            <Link 
              to={`/returns/${order.returnRequest.returnId}`}
              className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 font-medium"
            >
              View Return Details →
            </Link>
          )}
        </div>
      )}

      {/* Return Eligibility Section - Show when delivered and can return */}
      {order.status === 'Delivered' && canReturn && isWithinReturnWindow && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg shadow-sm p-6 mb-6 border border-orange-200 dark:border-orange-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-full">
                <FiRefreshCw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Need to Return?</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You have <span className="font-semibold text-orange-600 dark:text-orange-400">{daysRemainingForReturn} days</span> remaining to request a return for this order.
                </p>
                <ul className="mt-2 text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Free pickup from your address
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Full refund to original payment method
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Process completed in 5-7 business days
                  </li>
                </ul>
              </div>
            </div>
            <Link
              to={`/orders/${id}/return`}
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-lg shadow-orange-600/25"
            >
              <FiRefreshCw className="mr-2" /> Request Return
            </Link>
          </div>
        </div>
      )}

      {/* Return Window Expired Notice */}
      {order.status === 'Delivered' && !isWithinReturnWindow && !hasActiveReturn && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full">
              <FiRefreshCw className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Return Window Expired</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                The 30-day return window for this order has expired. If you have any issues with your order, please contact our support team.
              </p>
              <Link
                to="/help"
                className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Cancel only (Return moved to section above) */}
      {canCancel && (
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
          >
            <FiX className="mr-2" /> Cancel Order
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation (minimum 10 characters)"
              className="w-full p-3 border rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isLoading || cancelReason.length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Request Return</h3>
            <p className="text-gray-600 mb-4">
              Please provide a detailed reason for returning this order. Returns are processed within 5-7 business days.
            </p>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Please provide a detailed reason for the return (minimum 20 characters)"
              className="w-full p-3 border rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowReturnModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={isLoading || returnReason.length < 20}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
