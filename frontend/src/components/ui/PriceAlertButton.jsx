import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiDollarSign, FiPercent } from 'react-icons/fi';
import { createPriceAlert } from '../../store/slices/activitySlice';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const PriceAlertButton = ({ productId, currentPrice, productName }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [targetType, setTargetType] = useState('percentage'); // 'percentage' or 'fixed'
  const [percentage, setPercentage] = useState(10);
  const [fixedPrice, setFixedPrice] = useState(Math.floor(currentPrice * 0.9));
  const [loading, setLoading] = useState(false);

  const handleCreateAlert = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to set price alerts');
      return;
    }

    const targetPrice = targetType === 'percentage' 
      ? Math.floor(currentPrice * (1 - percentage / 100))
      : fixedPrice;

    if (targetPrice >= currentPrice) {
      toast.error('Target price must be lower than current price');
      return;
    }

    if (targetPrice <= 0) {
      toast.error('Target price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await dispatch(createPriceAlert({ productId, targetPrice })).unwrap();
      toast.success(`We'll notify you when price drops to ${formatPrice(targetPrice)}`);
      setShowModal(false);
    } catch (error) {
      toast.error(error || 'Failed to create price alert');
    } finally {
      setLoading(false);
    }
  };

  const calculatedTarget = targetType === 'percentage'
    ? Math.floor(currentPrice * (1 - percentage / 100))
    : fixedPrice;

  const savings = currentPrice - calculatedTarget;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <FiBell className="w-4 h-4" />
        Set Price Drop Alert
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiBell className="text-amber-500" />
                  Price Drop Alert
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close modal"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Product Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(currentPrice)}
                </p>
              </div>

              {/* Alert Type Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setTargetType('percentage')}
                  className={`py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                    targetType === 'percentage'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <FiPercent className="w-4 h-4" />
                  Percentage Off
                </button>
                <button
                  onClick={() => setTargetType('fixed')}
                  className={`py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                    targetType === 'fixed'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <FiDollarSign className="w-4 h-4" />
                  Fixed Price
                </button>
              </div>

              {/* Input */}
              {targetType === 'percentage' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notify me when price drops by
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={percentage}
                      onChange={(e) => setPercentage(parseInt(e.target.value))}
                      className="flex-1 accent-primary-500"
                    />
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400 min-w-[50px] text-right">
                      {percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notify me when price drops to
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={currentPrice - 1}
                      value={fixedPrice}
                      onChange={(e) => setFixedPrice(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400">Target Price</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(calculatedTarget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-700 dark:text-green-400">You'll Save</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(savings)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={loading || calculatedTarget >= currentPrice}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiBell className="w-4 h-4" />
                      Set Alert
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                We'll notify <span className="font-medium">only you</span> when the price drops to your target
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PriceAlertButton;
