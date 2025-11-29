import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiShoppingCart, FiClock } from 'react-icons/fi';
import { fetchQuickBuyList } from '../../store/slices/activitySlice';
import { addToCart } from '../../store/slices/cartSlice';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const QuickBuySection = () => {
  const dispatch = useDispatch();
  const { quickBuyList, quickBuyLoading } = useSelector((state) => state.activity);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchQuickBuyList());
    }
  }, [dispatch, isAuthenticated]);

  const handleQuickBuy = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  const formatLastPurchased = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (!isAuthenticated || quickBuyList.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quick Reorder
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your frequently purchased items
              </p>
            </div>
          </div>
          <Link
            to="/buy-again"
            className="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium"
          >
            View All
          </Link>
        </div>

        {quickBuyLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl p-3 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <AnimatePresence>
              {quickBuyList.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-4"
                >
                  <Link to={`/products/${product._id}`} className="block">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={product.images?.[0]?.url || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatLastPurchased(product.lastPurchased)}
                    </span>
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                      Bought {product.purchaseCount}x
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuickBuy(product)}
                    disabled={product.stock === 0}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    Quick Add
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
};

export default QuickBuySection;
