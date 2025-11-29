import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiTrendingDown,
  FiTrash2,
  FiShoppingCart,
  FiAlertCircle,
  FiCheckCircle,
  FiPlus,
} from 'react-icons/fi';
import {
  fetchPriceAlerts,
  deletePriceAlert,
  createPriceAlert,
} from '../store/slices/activitySlice';
import { addToCart } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const PriceAlertsPage = () => {
  const dispatch = useDispatch();
  const { priceAlerts, priceAlertsLoading } = useSelector((state) => state.activity);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showTriggeredOnly, setShowTriggeredOnly] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPriceAlerts());
    }
  }, [dispatch, isAuthenticated]);

  const handleDeleteAlert = async (alertId) => {
    try {
      await dispatch(deletePriceAlert(alertId)).unwrap();
      toast.success('Price alert removed');
    } catch (error) {
      toast.error(error || 'Failed to remove alert');
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ 
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        stock: product.stock,
      }, 
      quantity: 1 
    }));
    toast.success('Added to cart!');
  };

  const triggeredAlerts = priceAlerts.filter((alert) => alert.isTriggered);
  const pendingAlerts = priceAlerts.filter((alert) => !alert.isTriggered);
  const displayedAlerts = showTriggeredOnly ? triggeredAlerts : priceAlerts;

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <FiBell className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your price alerts
          </h2>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FiBell className="text-primary-500" />
            Price Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get notified when prices drop on your favorite products
          </p>
        </div>

        {triggeredAlerts.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTriggeredOnly(!showTriggeredOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showTriggeredOnly
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiCheckCircle className="inline mr-2" />
              {triggeredAlerts.length} Price Dropped!
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Alerts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{priceAlerts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Price Dropped</p>
          <p className="text-2xl font-bold text-green-500">{triggeredAlerts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Waiting</p>
          <p className="text-2xl font-bold text-orange-500">{pendingAlerts.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Savings</p>
          <p className="text-2xl font-bold text-primary-500">
            {triggeredAlerts.length > 0
              ? formatPrice(
                  triggeredAlerts.reduce((sum, a) => sum + a.priceDrop, 0) / triggeredAlerts.length
                )
              : '₹0'}
          </p>
        </div>
      </div>

      {/* Alerts List */}
      {priceAlertsLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedAlerts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <FiBell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No price alerts yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add products to your wishlist and set price alerts to get notified when prices drop
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {displayedAlerts.map((alert) => (
              <motion.div
                key={alert._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-l-4 ${
                  alert.isTriggered
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                    : 'border-orange-500'
                }`}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  <Link to={`/products/${alert.product._id}`} className="flex-shrink-0">
                    <img
                      src={alert.product.images?.[0]?.url || '/placeholder.jpg'}
                      alt={alert.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        to={`/products/${alert.product._id}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-primary-500 line-clamp-2"
                      >
                        {alert.product.name}
                      </Link>
                      {alert.isTriggered && (
                        <span className="flex-shrink-0 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                          <FiTrendingDown className="w-4 h-4" />
                          Price Dropped!
                        </span>
                      )}
                    </div>

                    {/* Price Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Target: </span>
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          {formatPrice(alert.targetPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Original: </span>
                        <span className="text-gray-500 line-through">
                          {formatPrice(alert.originalPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Current: </span>
                        <span
                          className={`font-bold ${
                            alert.isTriggered ? 'text-green-500' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {formatPrice(alert.currentPrice)}
                        </span>
                      </div>
                      {alert.priceDrop > 0 && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                          Save {formatPrice(alert.priceDrop)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {alert.isTriggered && alert.product.stock > 0 && (
                        <button
                          onClick={() => handleAddToCart(alert.product)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <FiShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="flex items-center gap-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default PriceAlertsPage;
