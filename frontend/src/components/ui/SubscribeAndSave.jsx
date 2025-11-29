import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  RefreshCw,
  Check,
  ChevronDown,
  Percent,
  Calendar,
  Package,
  Clock,
  Truck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatPrice } from '../../utils/helpers';

const SubscribeAndSave = ({ product, quantity = 1, selectedVariants = {} }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const frequencies = [
    { id: 'weekly', label: 'Every Week', discount: 15 },
    { id: 'biweekly', label: 'Every 2 Weeks', discount: 12 },
    { id: 'monthly', label: 'Every Month', discount: 10 },
    { id: 'bimonthly', label: 'Every 2 Months', discount: 7 },
    { id: 'quarterly', label: 'Every 3 Months', discount: 5 },
  ];

  const selectedFreq = frequencies.find((f) => f.id === frequency) || frequencies[2];
  const discountedPrice = product.price * (1 - selectedFreq.discount / 100);
  const savings = product.price - discountedPrice;

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Navigate to subscription checkout
      navigate('/checkout/subscription', {
        state: {
          items: [{
            productId: product._id,
            quantity,
            variant: selectedVariants,
          }],
          frequency,
          discount: selectedFreq.discount,
        },
      });
    } catch (error) {
      toast.error('Failed to start subscription');
    } finally {
      setLoading(false);
    }
  };

  // Show Subscribe & Save for all products (or only if explicitly marked as subscribable)
  // Uncomment the condition below if you want to limit to specific products
  // if (product.isSubscribable === false) {
  //   return null;
  // }

  return (
    <div className="border-2 border-primary-200 dark:border-primary-800 rounded-xl overflow-hidden bg-primary-50/50 dark:bg-primary-900/20">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary-100/50 dark:hover:bg-primary-900/30 transition"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Subscribe & Save
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Up to 15% OFF
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Save on every delivery, cancel anytime
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Frequency
            </label>
            <div className="space-y-2">
              {frequencies.map((freq) => (
                <label
                  key={freq.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                    frequency === freq.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="frequency"
                      value={freq.id}
                      checked={frequency === freq.id}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-4 h-4 text-primary-600"
                    />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {freq.label}
                      </span>
                    </div>
                  </div>
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-sm font-medium">
                    Save {freq.discount}%
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Regular Price</span>
              <span className="text-gray-500 line-through">{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Percent className="w-4 h-4" />
                {selectedFreq.label} Discount
              </span>
              <span className="text-green-600 dark:text-green-400">-{formatPrice(savings)}</span>
            </div>
            <div className="border-t dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">
                  Subscription Price
                </span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(discountedPrice)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                per delivery
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-green-500" />
              <span>Free shipping</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-green-500" />
              <span>Skip deliveries</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Check className="w-4 h-4 text-green-500" />
              <span>Modify frequency</span>
            </div>
          </div>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Setting up...' : 'Subscribe & Save ' + formatPrice(savings)}
          </button>

          {/* Delivery Info */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Truck className="w-4 h-4" />
            <span>First delivery ships in 5-7 days</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscribeAndSave;
