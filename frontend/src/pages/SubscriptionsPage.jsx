import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  skipNextDelivery,
  updateFrequency,
} from '../store/slices/subscriptionSlice';
import {
  Package,
  Calendar,
  Pause,
  Play,
  X,
  Clock,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Check,
  SkipForward,
} from 'lucide-react';
import Spinner from '../components/ui/Spinner';

const SubscriptionsPage = () => {
  const dispatch = useDispatch();
  const { subscriptions, loading } = useSelector((state) => state.subscriptions);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  useEffect(() => {
    dispatch(fetchMySubscriptions());
  }, [dispatch]);

  const handlePause = async (id) => {
    if (window.confirm('Are you sure you want to pause this subscription?')) {
      await dispatch(pauseSubscription(id));
      dispatch(fetchMySubscriptions());
    }
  };

  const handleResume = async (id) => {
    await dispatch(resumeSubscription(id));
    dispatch(fetchMySubscriptions());
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
      await dispatch(cancelSubscription(id));
      dispatch(fetchMySubscriptions());
    }
  };

  const handleSkip = async (id) => {
    if (window.confirm('Skip the next delivery?')) {
      await dispatch(skipNextDelivery(id));
      dispatch(fetchMySubscriptions());
    }
  };

  const handleFrequencyChange = async (id, frequency) => {
    await dispatch(updateFrequency({ id, frequency }));
    setShowFrequencyModal(false);
    dispatch(fetchMySubscriptions());
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const frequencyLabels = {
    weekly: 'Every Week',
    biweekly: 'Every 2 Weeks',
    monthly: 'Every Month',
    bimonthly: 'Every 2 Months',
    quarterly: 'Every 3 Months',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Subscribe & Save
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your subscriptions and save up to 15% on regular deliveries
            </p>
          </div>
          <Link
            to="/products"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Add Products
          </Link>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold mb-4">Subscribe & Save Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Check className="w-5 h-5" />
              </div>
              <span>Save 5-15% on every order</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <span>Free shipping on subscriptions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span>Cancel or skip anytime</span>
            </div>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <RefreshCw className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No active subscriptions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Subscribe to your favorite products and save on every delivery.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Browse Products
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <div
                key={subscription._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                {/* Subscription Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subscription.subscriptionNumber}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {subscription.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleSkip(subscription._id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            title="Skip next delivery"
                          >
                            <SkipForward className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handlePause(subscription._id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                            title="Pause subscription"
                          >
                            <Pause className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {subscription.status === 'paused' && (
                        <button
                          onClick={() => handleResume(subscription._id)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                          title="Resume subscription"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      {subscription.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(subscription._id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                          title="Cancel subscription"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Next Delivery Info */}
                  {subscription.status === 'active' && (
                    <div className="mt-4 flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Next delivery: {formatDate(subscription.nextDeliveryDate)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setShowFrequencyModal(true);
                        }}
                        className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <Clock className="w-4 h-4" />
                        {frequencyLabels[subscription.frequency]}
                      </button>
                    </div>
                  )}

                  {subscription.skipNextDelivery && (
                    <div className="mt-2 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Next delivery will be skipped
                    </div>
                  )}
                </div>

                {/* Subscription Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {subscription.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <Link
                            to={`/products/${item.product}`}
                            className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {item.name}
                          </Link>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            ${item.discountedPrice?.toFixed(2)}
                          </div>
                          {item.price !== item.discountedPrice && (
                            <div className="text-sm text-gray-500 line-through">
                              ${item.price?.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Subtotal</span>
                      <span>${subscription.subtotal?.toFixed(2)}</span>
                    </div>
                    {subscription.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mb-1">
                        <span>Subscription Savings</span>
                        <span>-${subscription.discountAmount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Shipping</span>
                      <span>{subscription.shippingPrice > 0 ? `$${subscription.shippingPrice?.toFixed(2)}` : 'FREE'}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>Tax</span>
                      <span>${subscription.taxPrice?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 dark:text-white text-lg">
                      <span>Total per delivery</span>
                      <span>${subscription.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery History */}
                {subscription.deliveries && subscription.deliveries.length > 0 && (
                  <div className="px-6 pb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Delivery History ({subscription.deliveryCount} deliveries)
                    </h4>
                    <div className="space-y-2">
                      {subscription.deliveries.slice(-3).map((delivery, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
                        >
                          <span>{formatDate(delivery.deliveredAt)}</span>
                          <Link
                            to={`/orders/${delivery.orderId}`}
                            className="text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            View Order
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Frequency Modal */}
        {showFrequencyModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Change Delivery Frequency
              </h3>
              <div className="space-y-3">
                {Object.entries(frequencyLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFrequencyChange(selectedSubscription._id, key)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      selectedSubscription.frequency === key
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFrequencyModal(false)}
                className="w-full mt-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
