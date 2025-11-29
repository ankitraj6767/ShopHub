import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiX, FiShoppingCart, FiHeart, FiStar, FiCheck, FiMinus, FiPlus, FiArrowLeft, FiTrash2, FiAward, FiPackage, FiTag, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCompareItems, removeFromCompare, clearCompare } from '../store/slices/compareSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const ComparePage = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectCompareItems) || [];

  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  const handleAddToWishlist = (product) => {
    dispatch(addToWishlist({ productId: product._id }));
    toast.success('Added to wishlist');
  };

  // Find the best value (lowest price with good rating)
  const getBestValue = () => {
    if (items.length < 2) return null;
    const sorted = [...items].sort((a, b) => {
      const scoreA = (a.rating || 0) / (a.price || 1);
      const scoreB = (b.rating || 0) / (b.price || 1);
      return scoreB - scoreA;
    });
    return sorted[0]?._id;
  };
  const bestValueId = getBestValue();

  // Find highest rated
  const getHighestRated = () => {
    if (items.length < 2) return null;
    const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted[0]?._id;
  };
  const highestRatedId = getHighestRated();

  // Find lowest price
  const getLowestPrice = () => {
    if (items.length < 2) return null;
    const sorted = [...items].sort((a, b) => (a.price || 0) - (b.price || 0));
    return sorted[0]?._id;
  };
  const lowestPriceId = getLowestPrice();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            No Products to Compare
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
            Add products to your compare list to see a side-by-side comparison of their features, prices, and ratings.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
          >
            <FiArrowLeft className="w-5 h-5" />
            Browse Products
          </Link>
        </motion.div>
      </div>
    );
  }

  const specs = [
    { 
      key: 'price', 
      label: 'Price', 
      icon: FiTag,
      render: (item) => (
        <div className="flex flex-col items-center">
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            {formatPrice(item.price)}
          </span>
          {item._id === lowestPriceId && items.length > 1 && (
            <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 sm:px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
              Lowest
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'rating', 
      label: 'Rating', 
      icon: FiStar,
      render: (item) => (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={`w-3 h-3 sm:w-5 sm:h-5 ${
                  star <= Math.round(item.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-2">
            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{item.rating?.toFixed(1) || 'N/A'}</span>
            <span className="text-gray-400 text-[10px] sm:text-sm">({item.numReviews || 0})</span>
          </div>
          {item._id === highestRatedId && items.length > 1 && (
            <span className="text-[10px] sm:text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 sm:px-2 py-0.5 rounded-full mt-1 whitespace-nowrap">
              Top
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'brand', 
      label: 'Brand', 
      icon: FiAward,
      render: (item) => (
        <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-base truncate max-w-[60px] sm:max-w-none">{item.brand || '-'}</span>
      )
    },
    { 
      key: 'category', 
      label: 'Category', 
      icon: FiTag,
      render: (item) => (
        <span className="px-1.5 sm:px-3 py-0.5 sm:py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[10px] sm:text-sm font-medium truncate max-w-[60px] sm:max-w-none">
          {item.category || '-'}
        </span>
      )
    },
    { 
      key: 'stock', 
      label: 'Stock', 
      icon: FiPackage,
      render: (item) => (
        item.stock > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-600 dark:text-green-400 font-medium text-[10px] sm:text-sm">
              <span className="hidden sm:inline">In Stock ({item.stock})</span>
              <span className="sm:hidden">{item.stock}</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></span>
            <span className="text-red-600 dark:text-red-400 font-medium text-[10px] sm:text-sm">
              <span className="hidden sm:inline">Out of Stock</span>
              <span className="sm:hidden">Out</span>
            </span>
          </div>
        )
      )
    },
    { 
      key: 'description', 
      label: 'Info', 
      icon: FiInfo,
      render: (item) => (
        <p className="text-[10px] sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 text-left">
          {item.description || 'No description'}
        </p>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <Link
                to="/products"
                className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Compare Products
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base ml-8 sm:ml-11">
              Comparing {items.length} product{items.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 ml-8 sm:ml-0">
            <button
              onClick={() => dispatch(clearCompare())}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg sm:rounded-xl transition text-xs sm:text-sm font-medium"
            >
              <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
            <Link
              to="/products"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition text-xs sm:text-sm font-medium"
            >
              <FiPlus className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Add More</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </motion.div>

        {/* Product Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
        >
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border-2 ${
                item._id === bestValueId ? 'border-purple-500 ring-2 sm:ring-4 ring-purple-500/20' : 'border-transparent'
              }`}>
                {item._id === bestValueId && items.length > 1 && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white text-[10px] sm:text-xs font-bold py-1 sm:py-1.5 text-center z-10">
                    ⭐ BEST VALUE
                  </div>
                )}
                <button
                  onClick={() => dispatch(removeFromCompare(item._id))}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-700 hover:bg-red-500 text-gray-400 hover:text-white rounded-full shadow-lg flex items-center justify-center transition-all z-20"
                >
                  <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <Link to={`/products/${item._id}`} className="block">
                  <div className={`relative aspect-square bg-gray-100 dark:bg-gray-700 ${item._id === bestValueId ? 'pt-6' : ''}`}>
                    <img
                      src={item.images?.[0]?.url || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-contain p-2 sm:p-4 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=Product';
                      }}
                    />
                  </div>
                  <div className="p-2 sm:p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 sm:mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition text-xs sm:text-base min-h-[32px] sm:min-h-[48px]">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        {formatPrice(item.price)}
                      </span>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <FiStar className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                        <span className="text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                          {item.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="px-2 sm:px-4 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock === 0}
                    className="w-full flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all text-xs sm:text-sm"
                  >
                    <FiShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    <span className="sm:hidden">{item.stock === 0 ? 'Out' : 'Cart'}</span>
                  </button>
                  <button
                    onClick={() => handleAddToWishlist(item)}
                    className="w-full flex items-center justify-center gap-1 sm:gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition text-xs sm:text-sm"
                  >
                    <FiHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add to Wishlist</span>
                    <span className="sm:hidden">Wishlist</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* Add more product slots */}
          {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
            <motion.div
              key={`empty-${i}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (items.length + i) * 0.1 }}
              className="hidden sm:block"
            >
              <Link
                to="/products"
                className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl aspect-[3/4] hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition">
                  <FiPlus className="w-8 h-8 text-gray-400 group-hover:text-purple-500 transition" />
                </div>
                <span className="text-gray-500 group-hover:text-purple-600 font-medium transition">
                  Add Product
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-bold text-white">Feature Comparison</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-x-auto">
            {specs.map((spec, specIndex) => (
              <motion.div
                key={spec.key}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + specIndex * 0.05 }}
                className="flex hover:bg-gray-50 dark:hover:bg-gray-700/50 transition min-w-0"
              >
                <div className="flex-shrink-0 w-16 sm:w-28 p-2 sm:p-4 flex items-center gap-1 sm:gap-3 bg-gray-50 dark:bg-gray-700/30 border-r border-gray-200 dark:border-gray-700">
                  <spec.icon className="w-3 h-3 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-[10px] sm:text-sm truncate">
                    {spec.label}
                  </span>
                </div>
                <div className="flex-1 flex min-w-0">
                  {items.map((item) => (
                    <div key={item._id} className="flex-1 p-2 sm:p-4 flex items-center justify-center text-center min-w-[80px] sm:min-w-[120px] border-r border-gray-100 dark:border-gray-700 last:border-r-0">
                      {spec.render(item)}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        {items.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Found what you're looking for? Add your favorite to cart!
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              <FiArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
