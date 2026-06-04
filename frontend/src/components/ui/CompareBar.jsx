import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiX, FiChevronUp, FiChevronDown, FiTrash2, FiArrowRight, FiPlus, FiBarChart2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  selectCompareItems,
  selectCompareOpen,
  removeFromCompare,
  clearCompare,
  toggleComparePanel,
} from '../../store/slices/compareSlice';
import { formatPrice } from '../../utils/helpers';

const CompareBar = () => {
  const dispatch = useDispatch();
  const products = useSelector(selectCompareItems) || [];
  const isOpen = useSelector(selectCompareOpen) || false;

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Toggle Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white py-3 px-4 sm:px-6 flex items-center justify-between cursor-pointer shadow-2xl"
        onClick={() => dispatch(toggleComparePanel())}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FiBarChart2 className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
              {products.length}
            </span>
          </div>
          <div>
            <span className="font-semibold text-sm sm:text-base">Compare Products</span>
            <p className="text-xs text-white/70 hidden sm:block">
              {products.length} of 4 products selected
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Mini Product Avatars */}
          <div className="hidden sm:flex -space-x-2">
            {products.slice(0, 3).map((item, index) => (
              <div
                key={item._id}
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white"
                style={{ zIndex: 3 - index }}
              >
                <img
                  src={item.images?.[0]?.url || '/placeholder.jpg'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/50?text=P';
                  }}
                />
              </div>
            ))}
            {products.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-white/20 backdrop-blur flex items-center justify-center text-xs font-bold">
                +{products.length - 3}
              </div>
            )}
          </div>

          {products.length >= 2 && (
            <Link
              to="/compare"
              className="bg-white text-purple-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-yellow-400 hover:text-gray-900 transition-all flex items-center gap-2 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="hidden sm:inline">Compare Now</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
          )}
          
          <motion.button
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition"
          >
            <FiChevronUp className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                    Products to Compare
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select up to 4 products to compare their features
                  </p>
                </div>
                <button
                  onClick={() => dispatch(clearCompare())}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm font-medium"
                >
                  <FiTrash2 className="w-4 h-4" /> Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-lg">
                      <button
                        onClick={() => dispatch(removeFromCompare(item._id))}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all transform hover:scale-110 z-10"
                        aria-label="Remove from compare"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                      <Link to={`/products/${item._id}`} className="block">
                        <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-white dark:bg-gray-600">
                          <img
                            src={item.images?.[0]?.url || '/placeholder.jpg'}
                            alt={item.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100?text=Product';
                            }}
                          />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                          {item.name}
                        </h4>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                            {formatPrice(item.price)}
                          </p>
                          {item.rating && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-yellow-500">★</span>
                              <span className="text-gray-600 dark:text-gray-400">{item.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: 4 - products.length }).map((_, index) => (
                  <motion.div
                    key={`empty-${index}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: (products.length + index) * 0.1 }}
                  >
                    <Link
                      to="/products"
                      className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 flex flex-col items-center justify-center aspect-[4/5] hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition">
                        <FiPlus className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition" />
                      </div>
                      <span className="text-sm text-gray-400 group-hover:text-purple-500 transition font-medium">
                        Add Product
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {products.length >= 2 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 text-center"
                >
                  <Link
                    to="/compare"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <FiBarChart2 className="w-5 h-5" />
                    Compare {products.length} Products
                    <FiArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompareBar;
