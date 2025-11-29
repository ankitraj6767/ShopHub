import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
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
  Plus,
  Minus,
  ShoppingBag,
  Truck,
  Percent,
  Star,
  TrendingUp,
  Gift,
  Shield,
  Heart,
  Edit2,
  ChevronDown,
  Search,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import api from '../utils/api';
import { formatPrice } from '../utils/helpers';

const SubscriptionsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subscriptions, loading } = useSelector((state) => state.subscriptions);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // Product recommendations for subscription
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedFrequency, setSelectedFrequency] = useState('monthly');
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    dispatch(fetchMySubscriptions());
    fetchRecommendedProducts();
  }, [dispatch]);

  const fetchRecommendedProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await api.get('/products?limit=12&sort=-rating');
      setRecommendedProducts(response.data.data || []);
      setAllProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePause = async (id) => {
    if (window.confirm('Are you sure you want to pause this subscription?')) {
      await dispatch(pauseSubscription(id));
      toast.success('Subscription paused');
      dispatch(fetchMySubscriptions());
    }
  };

  const handleResume = async (id) => {
    await dispatch(resumeSubscription(id));
    toast.success('Subscription resumed');
    dispatch(fetchMySubscriptions());
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This cannot be undone.')) {
      await dispatch(cancelSubscription(id));
      toast.success('Subscription cancelled');
      dispatch(fetchMySubscriptions());
    }
  };

  const handleSkip = async (id) => {
    if (window.confirm('Skip the next delivery?')) {
      await dispatch(skipNextDelivery(id));
      toast.success('Next delivery will be skipped');
      dispatch(fetchMySubscriptions());
    }
  };

  const handleFrequencyChange = async (id, frequency) => {
    await dispatch(updateFrequency({ id, frequency }));
    toast.success('Delivery frequency updated');
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

  const frequencies = [
    { id: 'weekly', label: 'Every Week', discount: 15, description: 'Best for daily essentials' },
    { id: 'biweekly', label: 'Every 2 Weeks', discount: 12, description: 'Popular choice' },
    { id: 'monthly', label: 'Every Month', discount: 10, description: 'Most flexible' },
    { id: 'bimonthly', label: 'Every 2 Months', discount: 7, description: 'For occasional needs' },
    { id: 'quarterly', label: 'Every 3 Months', discount: 5, description: 'Seasonal deliveries' },
  ];

  const frequencyLabels = {
    weekly: 'Every Week',
    biweekly: 'Every 2 Weeks',
    monthly: 'Every Month',
    bimonthly: 'Every 2 Months',
    quarterly: 'Every 3 Months',
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const exists = prev.find(p => p._id === product._id);
      if (exists) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const updateProductQuantity = (productId, delta) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p._id === productId) {
          const newQty = Math.max(1, Math.min(10, p.quantity + delta));
          return { ...p, quantity: newQty };
        }
        return p;
      })
    );
  };

  const handleCreateSubscription = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    const selectedFreq = frequencies.find(f => f.id === selectedFrequency);
    
    navigate('/checkout/subscription', {
      state: {
        items: selectedProducts.map(p => ({
          productId: p._id,
          quantity: p.quantity,
          variant: {},
        })),
        frequency: selectedFrequency,
        discount: selectedFreq?.discount || 10,
      },
    });
  };

  const calculateTotalSavings = () => {
    const selectedFreq = frequencies.find(f => f.id === selectedFrequency);
    const discountPercent = selectedFreq?.discount || 10;
    const total = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    return total * (discountPercent / 100);
  };

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');
  const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled');

  const getTabSubscriptions = () => {
    switch (activeTab) {
      case 'active': return activeSubscriptions;
      case 'paused': return pausedSubscriptions;
      case 'cancelled': return cancelledSubscriptions;
      default: return subscriptions;
    }
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Subscribe & Save
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your subscriptions and save up to 15% on regular deliveries
            </p>
          </div>
          <button
            onClick={() => setShowAddProductModal(true)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create Subscription
          </button>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-xl font-bold mb-4">Subscribe & Save Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Percent className="w-5 h-5" />
              </div>
              <span>Save 5-15% on every order</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <span>Free shipping always</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span>Cancel or skip anytime</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <span>No commitment required</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {subscriptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeSubscriptions.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                  <Pause className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pausedSubscriptions.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Paused</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${subscriptions.reduce((sum, s) => sum + (s.discountAmount || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Saved</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subscriptions.reduce((sum, s) => sum + (s.deliveryCount || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deliveries</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {subscriptions.length === 0 ? (
          <>
            {/* Empty State */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center mb-8">
              <RefreshCw className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No active subscriptions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Subscribe to your favorite products and save on every delivery.
              </p>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
              >
                <Plus className="w-5 h-5" />
                Create Your First Subscription
              </button>
            </div>

            {/* Recommended Products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Popular for Subscription
              </h2>
              {loadingProducts ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {recommendedProducts.slice(0, 6).map((product) => (
                    <div
                      key={product._id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group"
                    >
                      <Link to={`/products/${product._id}`}>
                        <div className="relative aspect-square">
                          <img
                            src={product.images?.[0]?.url || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Save 10%
                          </div>
                        </div>
                      </Link>
                      <div className="p-3">
                        <Link to={`/products/${product._id}`}>
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 hover:text-primary-600">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{product.rating?.toFixed(1) || '4.5'}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <span className="text-primary-600 font-bold">${(product.price * 0.9).toFixed(2)}</span>
                            <span className="text-xs text-gray-400 line-through ml-1">${product.price?.toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedProducts([{ ...product, quantity: 1 }]);
                            setShowAddProductModal(true);
                          }}
                          className="w-full mt-2 bg-primary-600 text-white text-sm py-2 rounded-lg hover:bg-primary-700 transition"
                        >
                          Subscribe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === 'active'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Active ({activeSubscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('paused')}
                className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === 'paused'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Paused ({pausedSubscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === 'cancelled'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Cancelled ({cancelledSubscriptions.length})
              </button>
            </div>

            {/* Subscriptions List */}
            <div className="space-y-6">
              {getTabSubscriptions().length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No {activeTab} subscriptions</p>
                </div>
              ) : (
                getTabSubscriptions().map((subscription) => (
                  <div
                    key={subscription._id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Subscription Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                            <RefreshCw className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                Subscription #{subscription._id.slice(-6).toUpperCase()}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                                  subscription.status
                                )}`}
                              >
                                {subscription.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Created {formatDate(subscription.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {subscription.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSkip(subscription._id)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                                title="Skip next delivery"
                              >
                                <SkipForward className="w-4 h-4" />
                                <span className="hidden sm:inline">Skip</span>
                              </button>
                              <button
                                onClick={() => handlePause(subscription._id)}
                                className="flex items-center gap-2 px-4 py-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition"
                                title="Pause subscription"
                              >
                                <Pause className="w-4 h-4" />
                                <span className="hidden sm:inline">Pause</span>
                              </button>
                            </>
                          )}
                          {subscription.status === 'paused' && (
                            <button
                              onClick={() => handleResume(subscription._id)}
                              className="flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                              title="Resume subscription"
                            >
                              <Play className="w-4 h-4" />
                              <span className="hidden sm:inline">Resume</span>
                            </button>
                          )}
                          {subscription.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(subscription._id)}
                              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title="Cancel subscription"
                            >
                              <X className="w-4 h-4" />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Next Delivery Info */}
                      {subscription.status === 'active' && (
                        <div className="mt-4 flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-xs text-green-600 dark:text-green-400">Next Delivery</p>
                              <p className="font-medium text-green-700 dark:text-green-300">{formatDate(subscription.nextDeliveryDate)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowFrequencyModal(true);
                            }}
                            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          >
                            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <div className="text-left">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                              <p className="font-medium text-gray-900 dark:text-white">{frequencyLabels[subscription.frequency]}</p>
                            </div>
                            <Edit2 className="w-4 h-4 text-gray-400 ml-2" />
                          </button>
                        </div>
                      )}

                      {subscription.skipNextDelivery && (
                        <div className="mt-4 flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-lg">
                          <AlertCircle className="w-5 h-5" />
                          <span>Next delivery will be skipped</span>
                        </div>
                      )}
                    </div>

                    {/* Subscription Items */}
                    <div className="p-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Items in this subscription</h4>
                      <div className="space-y-4">
                        {subscription.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <img
                              src={item.image || '/placeholder.jpg'}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <Link
                                to={`/products/${item.product}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                              >
                                {item.name}
                              </Link>
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Quantity: {item.quantity}
                              </div>
                              {item.variant && Object.keys(item.variant).length > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {Object.entries(item.variant).map(([key, value]) => (
                                    <span key={key} className="mr-2">{key}: {value}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-primary-600 dark:text-primary-400">
                                ${item.discountedPrice?.toFixed(2)}
                              </div>
                              {item.price !== item.discountedPrice && (
                                <div className="text-sm text-gray-500 line-through">
                                  ${item.price?.toFixed(2)}
                                </div>
                              )}
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Save ${((item.price - item.discountedPrice) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Subtotal</span>
                          <span>${subscription.subtotal?.toFixed(2)}</span>
                        </div>
                        {subscription.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Percent className="w-4 h-4" />
                              Subscription Discount
                            </span>
                            <span>-${subscription.discountAmount?.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Truck className="w-4 h-4" />
                            Shipping
                          </span>
                          <span className={subscription.shippingPrice === 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                            {subscription.shippingPrice > 0 ? `$${subscription.shippingPrice?.toFixed(2)}` : 'FREE'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span>Tax</span>
                          <span>${subscription.taxPrice?.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between font-bold text-lg">
                          <span className="text-gray-900 dark:text-white">Total per delivery</span>
                          <span className="text-primary-600 dark:text-primary-400">${subscription.totalPrice?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery History */}
                    {subscription.deliveries && subscription.deliveries.length > 0 && (
                      <div className="px-6 pb-6">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Delivery History ({subscription.deliveryCount} total)
                        </h4>
                        <div className="space-y-2">
                          {subscription.deliveries.slice(-3).map((delivery, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500" />
                                <span className="text-gray-600 dark:text-gray-400">{formatDate(delivery.deliveredAt)}</span>
                              </div>
                              <Link
                                to={`/orders/${delivery.orderId}`}
                                className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                              >
                                View Order
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Add Product Modal */}
        {showAddProductModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Create Subscription
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddProductModal(false);
                      setSelectedProducts([]);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Select products and choose your delivery frequency
                </p>
              </div>

              {/* Search */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const isSelected = selectedProducts.some(p => p._id === product._id);
                    const selectedProduct = selectedProducts.find(p => p._id === product._id);
                    
                    return (
                      <div
                        key={product._id}
                        className={`relative bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer transition ${
                          isSelected ? 'ring-2 ring-primary-600' : 'hover:shadow-md'
                        }`}
                        onClick={() => toggleProductSelection(product)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary-600 text-white p-1 rounded-full z-10">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <div className="aspect-square">
                          <img
                            src={product.images?.[0]?.url || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                            {product.name}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-primary-600">${product.price?.toFixed(2)}</span>
                            {isSelected && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => updateProductQuantity(product._id, -1)}
                                  className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 text-sm font-medium">{selectedProduct?.quantity}</span>
                                <button
                                  onClick={() => updateProductQuantity(product._id, 1)}
                                  className="p-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frequency Selection & Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Frequency Selection */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Frequency
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {frequencies.map((freq) => (
                        <button
                          key={freq.id}
                          onClick={() => setSelectedFrequency(freq.id)}
                          className={`p-3 rounded-lg border-2 text-center transition ${
                            selectedFrequency === freq.id
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{freq.label}</div>
                          <div className="text-green-600 text-xs font-bold">Save {freq.discount}%</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="lg:w-64 bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Products ({selectedProducts.length})</span>
                        <span>${selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({frequencies.find(f => f.id === selectedFrequency)?.discount}%)</span>
                        <span>-${calculateTotalSavings().toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                        <span>Total</span>
                        <span>
                          ${(selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0) - calculateTotalSavings()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleCreateSubscription}
                      disabled={selectedProducts.length === 0}
                      className="w-full mt-4 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Subscribe Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
                {frequencies.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => handleFrequencyChange(selectedSubscription._id, freq.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      selectedSubscription.frequency === freq.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{freq.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{freq.description}</div>
                      </div>
                      <div className="text-green-600 font-bold">Save {freq.discount}%</div>
                    </div>
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
