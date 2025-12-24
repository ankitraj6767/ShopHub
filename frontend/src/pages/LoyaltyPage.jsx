import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiAward,
  FiStar,
  FiTrendingUp,
  FiGift,
  FiUsers,
  FiChevronRight,
  FiShield,
  FiTruck,
  FiPercent,
  FiZap,
  FiHexagon,
  FiDollarSign,
  FiCreditCard,
} from 'react-icons/fi';
import { safeToLocaleDateString } from '../utils/helpers';

// Using FiAward for crown, FiHexagon for diamond/gem as alternatives
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { fetchWallet } from '../store/slices/userSlice';

const LoyaltyPage = () => {
  const dispatch = useDispatch();
  const { wallet } = useSelector((state) => state.users);
  const [loyalty, setLoyalty] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchData();
    dispatch(fetchWallet());
  }, [dispatch]);

  const fetchData = async () => {
    try {
      const [loyaltyRes, tiersRes, leaderboardRes] = await Promise.all([
        api.get('/loyalty'),
        api.get('/loyalty/tiers'),
        api.get('/loyalty/leaderboard'),
      ]);
      setLoyalty(loyaltyRes.data.data);
      setTiers(tiersRes.data.data);
      setLeaderboard(leaderboardRes.data.data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points < 100) {
      toast.error('Minimum 100 points required');
      return;
    }
    if (points > loyalty.points) {
      toast.error('Insufficient points');
      return;
    }

    setRedeeming(true);
    try {
      const { data } = await api.post('/loyalty/redeem', { points });
      toast.success(`🎉 Redeemed ${points} points! ₹${data.data.dollarValue.toFixed(2)} added to your wallet!`);
      setLoyalty({
        ...loyalty,
        points: data.data.remainingPoints,
      });
      setRedeemAmount('');
      // Refresh wallet balance
      dispatch(fetchWallet());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'Diamond':
        return <FiHexagon className="w-6 h-6" />;
      case 'Platinum':
        return <FiStar className="w-6 h-6" />;
      case 'Gold':
        return <FiAward className="w-6 h-6" />;
      default:
        return <FiAward className="w-6 h-6" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Diamond':
        return 'from-cyan-400 to-blue-500';
      case 'Platinum':
        return 'from-gray-400 to-gray-600';
      case 'Gold':
        return 'from-yellow-400 to-amber-500';
      case 'Silver':
        return 'from-gray-300 to-gray-400';
      default:
        return 'from-orange-400 to-orange-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${getTierColor(loyalty?.tier || 'Bronze')} rounded-3xl p-8 text-white mb-8`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              {getTierIcon(loyalty?.tier)}
            </div>
            <div>
              <p className="text-white/80 text-sm">Your Status</p>
              <h1 className="text-3xl font-bold">{loyalty?.tier} Member</h1>
              <p className="text-white/80">
                {loyalty?.pointsToNextTier
                  ? `${loyalty.pointsToNextTier.pointsNeeded.toLocaleString()} points to ${loyalty.pointsToNextTier.tier}`
                  : 'You are at the highest tier!'}
              </p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-white/80 text-sm">Available Points</p>
            <p className="text-5xl font-bold">{loyalty?.points.toLocaleString()}</p>
            <p className="text-white/80">= ₹{(loyalty?.points / 100).toFixed(2)} value</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {loyalty?.pointsToNextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>{loyalty.tier}</span>
              <span>{loyalty.pointsToNextTier.tier}</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    ((loyalty.lifetimePoints) /
                      (loyalty.lifetimePoints + loyalty.pointsToNextTier.pointsNeeded)) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <FiStar className="w-6 h-6 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold dark:text-white">{loyalty?.lifetimePoints.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Lifetime Points</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <FiTrendingUp className="w-6 h-6 text-green-500 mb-2" />
              <p className="text-2xl font-bold dark:text-white">{loyalty?.benefits?.pointsMultiplier}x</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Points Multiplier</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <FiGift className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold dark:text-white">{loyalty?.benefits?.birthdayBonus || 0}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Birthday Bonus</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
              <FiTruck className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-2xl font-bold dark:text-white">{loyalty?.benefits?.freeShipping ? 'Free' : 'Standard'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shipping</p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-6 shadow-md text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiCreditCard className="w-6 h-6" />
                  <h2 className="text-xl font-bold">My Wallet</h2>
                </div>
                <p className="text-white/80 text-sm mb-1">Available Balance</p>
                <p className="text-4xl font-bold">₹{(wallet?.balance || 0).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Use at checkout</p>
                <p className="text-white/80 text-xs mt-1">Redeem points to add funds →</p>
              </div>
            </div>
          </div>

          {/* Redeem Points */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiPercent className="w-5 h-5 text-primary-600" />
              Redeem Points to Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Convert your points to wallet balance! 100 points = ₹10. Use wallet balance at checkout.
            </p>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Enter points (min 100)"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  min="100"
                  step="100"
                />
              </div>
              <button
                onClick={handleRedeem}
                disabled={redeeming || !redeemAmount}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {redeeming ? 'Redeeming...' : 'Redeem to Wallet'}
              </button>
            </div>
            {redeemAmount && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                <FiDollarSign className="inline w-4 h-4" />
                You'll get ₹{(parseInt(redeemAmount) / 10).toFixed(2)} added to your wallet
              </p>
            )}
          </div>

          {/* Points History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiZap className="w-5 h-5 text-primary-600" />
              Points History
            </h2>
            <div className="space-y-3">
              {loyalty?.history?.length > 0 ? (
                loyalty.history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.type === 'referral' 
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                            : item.type === 'bonus'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                            : item.points > 0 
                            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {item.type === 'referral' ? (
                          <FiUsers className="w-5 h-5" />
                        ) : item.type === 'bonus' ? (
                          <FiGift className="w-5 h-5" />
                        ) : item.points > 0 ? (
                          <FiTrendingUp className="w-5 h-5" />
                        ) : (
                          <FiPercent className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">
                          {item.type === 'referral' && '🎁 '}
                          {item.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {safeToLocaleDateString(item.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-bold ${
                        item.type === 'referral'
                          ? 'text-purple-600 dark:text-purple-400'
                          : item.type === 'bonus'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : item.points > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {item.points > 0 ? '+' : ''}{item.points}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No points history yet</p>
              )}
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white">
              <FiShield className="w-5 h-5 text-primary-600" />
              Membership Tiers
            </h2>
            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-xl border-2 ${
                    tier.name === loyalty?.tier
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`bg-gradient-to-r ${getTierColor(tier.name)} text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {tier.name}
                      </span>
                      {tier.name === loyalty?.tier && (
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Current</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {tier.minPoints.toLocaleString()}+ points
                    </span>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiChevronRight className="w-4 h-4 text-primary-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiUsers className="w-5 h-5 text-primary-600" />
              Top Members
            </h2>
            <div className="space-y-3">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                            : index === 1
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            : index === 2
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div>
                        <p className="font-medium text-sm dark:text-white">{entry.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${getTierColor(entry.tier)} text-white`}>
                          {entry.tier}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No members on the leaderboard yet. Be the first!
                </p>
              )}
            </div>
          </div>

          {/* How to Earn */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">How to Earn</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiStar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium dark:text-white">Shop & Earn</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">10 points per ₹100 spent</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiAward className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium dark:text-white">Write Reviews</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">50 points per review</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium dark:text-white">Refer Friends</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">500 points per referral</p>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="font-bold mb-2">Invite Friends</h3>
            <p className="text-sm text-white/80 mb-4">
              Share your referral link and earn 500 points for each friend!
            </p>
            <Link
              to="/referrals"
              className="block w-full py-2 bg-white text-purple-600 rounded-lg font-medium text-center hover:bg-gray-100 transition-colors"
            >
              Get Referral Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyPage;
