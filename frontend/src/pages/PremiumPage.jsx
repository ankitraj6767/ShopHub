import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCrown,
  FaCheck,
  FaTruck,
  FaPercent,
  FaHeadset,
  FaBolt,
  FaStar,
  FaGift,
  FaShieldAlt,
  FaArrowRight,
  FaSpinner,
  FaCalendarAlt,
  FaCreditCard,
  FaTimes,
} from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PremiumPage = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/premium/plans');
      setPlans(data.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const { data } = await api.get('/premium/status');
      setIsPremium(data.isPremium);
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      return;
    }

    setSubscribing(true);
    try {
      const { data } = await api.post('/premium/subscribe', { plan: planId });
      toast.success(data.message);
      setIsPremium(true);
      setSubscription(data.subscription);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const { data } = await api.post('/premium/cancel');
      toast.success(data.message);
      await fetchSubscriptionStatus();
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      const { data } = await api.put('/premium/auto-renew');
      toast.success(data.message);
      setSubscription((prev) => ({ ...prev, autoRenew: data.autoRenew }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update auto-renew');
    }
  };

  const benefits = [
    {
      icon: FaPercent,
      title: 'Extra Discounts',
      description: 'Get up to 15% off on every product',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: FaTruck,
      title: 'Free Shipping',
      description: 'Unlimited free delivery on all orders',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: FaHeadset,
      title: 'Priority Support',
      description: '24/7 dedicated customer support',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: FaBolt,
      title: 'Early Access',
      description: 'First access to flash sales & deals',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      icon: FaStar,
      title: 'Loyalty Bonus',
      description: 'Earn 2-3x more loyalty points',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: FaGift,
      title: 'Exclusive Deals',
      description: 'Members-only special offers',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <FaSpinner className="animate-spin text-4xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?w=1920')] bg-cover bg-center mix-blend-overlay" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <FaCrown className="text-4xl sm:text-5xl text-yellow-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              ShopHub Premium
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Unlock exclusive benefits and save more on every purchase
            </p>
          </motion.div>
        </div>
      </div>

      {/* Current Subscription Status (if subscribed) */}
      {isPremium && subscription && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-yellow-400"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                  <FaCrown className="text-3xl text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {subscription.planName}
                    </h2>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {subscription.status === 'active' ? 'Active' : subscription.status}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subscription.discountPercent}% discount on all products
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <FaCalendarAlt />
                  <span className="text-sm">
                    {subscription.daysRemaining} days remaining
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Expires: {new Date(subscription.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-400">Auto-renewal:</span>
                <button
                  onClick={handleToggleAutoRenew}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    subscription.autoRenew ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {subscription.status !== 'cancelled' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Cancel Subscription
                </button>
              )}
            </div>

            {subscription.status === 'cancelled' && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  Your subscription has been cancelled. You can continue to enjoy premium benefits until {new Date(subscription.endDate).toLocaleDateString()}.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Benefits Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Premium Benefits
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Everything you get with your premium membership
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className={`w-12 h-12 ${benefit.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <benefit.icon className={`text-2xl ${benefit.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing Section */}
      {(!isPremium || subscription?.status === 'cancelled') && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select the plan that works best for you
            </p>
          </motion.div>

          {/* Plan Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedPlan === plan.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {plan.id === 'monthly' ? 'Monthly' : 'Yearly'}
                  {plan.savings && (
                    <span className="ml-1 text-xs text-green-300">Save ₹{plan.savings}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl transition-all ${
                  selectedPlan === plan.id
                    ? 'ring-2 ring-primary-500 scale-105'
                    : 'hover:shadow-2xl'
                } ${plan.id === 'yearly' ? 'border-2 border-yellow-400' : ''}`}
              >
                {plan.id === 'yearly' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /{plan.id === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {plan.id === 'yearly' && (
                    <p className="text-green-500 text-sm mt-1">
                      That's just ₹{Math.round(plan.price / 12)}/month
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <FaCheck className="text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    plan.id === 'yearly'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  } disabled:opacity-50`}
                >
                  {subscribing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCrown />
                      {isPremium ? 'Renew Now' : 'Get Premium'}
                      <FaArrowRight />
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="text-center mt-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You need to be logged in to subscribe
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                Login to continue <FaArrowRight />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap justify-center gap-8 opacity-60">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FaShieldAlt />
            <span className="text-sm">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FaCreditCard />
            <span className="text-sm">Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FaHeadset />
            <span className="text-sm">24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <FaTimes className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You'll continue to have access to premium benefits until your current billing period ends.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Keep Premium
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;
