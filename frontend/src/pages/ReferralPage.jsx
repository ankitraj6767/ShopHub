import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiGift,
  FiCopy,
  FiCheck,
  FiUsers,
  FiTrendingUp,
  FiShare2,
  FiMail,
  FiMessageCircle,
  FiTwitter,
  FiFacebook,
} from 'react-icons/fi';

// Using FiMessageCircle for WhatsApp as alternative
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { safeToLocaleDateString } from '../utils/helpers';
const ReferralPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [referralData, setReferralData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referralRes, leaderboardRes] = await Promise.all([
        api.get('/referrals'),
        api.get('/referrals/leaderboard'),
      ]);
      setReferralData(referralRes.data.data);
      setLeaderboard(leaderboardRes.data.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (platform) => {
    const message = `Join ShopHub using my referral link and get ${referralData.rewards.referred} bonus points! ${referralData.referralLink}`;
    const encodedMessage = encodeURIComponent(message);
    const encodedLink = encodeURIComponent(referralData.referralLink);

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedMessage}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      email: `mailto:?subject=Join ShopHub&body=${encodedMessage}`,
    };

    window.open(urls[platform], '_blank');
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
      {/* You Were Referred Banner - Show if user was referred by someone */}
      {referralData?.referredBy && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <FiGift className="w-7 h-7" />
              </div>
              <div>
                <p className="text-lg font-semibold">🎉 You joined via referral!</p>
                <p className="text-white/80">
                  Referred by <span className="font-medium">{referralData.referredBy.referrerName}</span>
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-3xl font-bold">+{referralData.referredBy.bonusReceived}</p>
              <p className="text-sm text-white/80">Bonus Points Received</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white mb-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiGift className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Refer & Earn</h1>
          <p className="text-lg text-white/80 mb-6">
            Invite your friends to ShopHub and earn {referralData?.rewards?.referrer} points for each successful referral!
            Your friends get {referralData?.rewards?.referred} bonus points too.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-3xl font-bold">{referralData?.totalReferrals || 0}</p>
              <p className="text-sm text-white/80">Total Invites</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-3xl font-bold">{(referralData?.totalReferrals || 0) - (referralData?.successfulReferrals || 0)}</p>
              <p className="text-sm text-white/80">Pending</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-3xl font-bold">{referralData?.successfulReferrals || 0}</p>
              <p className="text-sm text-white/80">Successful</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-3xl font-bold">{referralData?.totalEarnings || 0}</p>
              <p className="text-sm text-white/80">Points Earned</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Referral Link Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiShare2 className="w-5 h-5 text-purple-600" />
              Your Referral Link
            </h2>

            {/* Link Box */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3 font-mono text-sm overflow-hidden">
                <span className="truncate block dark:text-gray-200">{referralData?.referralLink}</span>
              </div>
              <button
                onClick={() => copyToClipboard(referralData?.referralLink)}
                className={`px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copied ? <FiCheck className="w-5 h-5" /> : <FiCopy className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Referral Code */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or share your code:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg font-bold text-lg dark:text-white">
                  {referralData?.referralCode}
                </code>
                <button
                  onClick={() => copyToClipboard(referralData?.referralCode)}
                  className="p-2 text-gray-500 hover:text-purple-600"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Share via:</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => shareVia('whatsapp')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiMessageCircle className="w-5 h-5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => shareVia('facebook')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiFacebook className="w-5 h-5" />
                  Facebook
                </button>
                <button
                  onClick={() => shareVia('twitter')}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                >
                  <FiTwitter className="w-5 h-5" />
                  Twitter
                </button>
                <button
                  onClick={() => shareVia('email')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <FiMail className="w-5 h-5" />
                  Email
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-6 dark:text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiShare2 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 dark:text-white">1. Share Link</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share your unique referral link with friends and family
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUsers className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 dark:text-white">2. Friends Sign Up</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  They create an account and get {referralData?.rewards?.referred} bonus points
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiGift className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 dark:text-white">3. You Earn</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get {referralData?.rewards?.referrer} points when they make their first purchase
                </p>
              </div>
            </div>
          </div>

          {/* Your Referrals */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiUsers className="w-5 h-5 text-purple-600" />
              Your Referrals
            </h2>
            {referralData?.referrals?.length > 0 ? (
              <div className="space-y-3">
                {referralData.referrals.map((referral, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        referral.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        <FiUsers className={`w-5 h-5 ${
                          referral.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{referral.user}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Joined {safeToLocaleDateString(referral.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          referral.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {referral.status === 'pending' ? 'Awaiting Purchase' : referral.status}
                      </span>
                      {referral.status === 'completed' && referral.reward > 0 ? (
                        <p className="text-sm text-green-600 mt-1">+{referral.reward} pts earned</p>
                      ) : referral.status === 'pending' ? (
                        <p className="text-sm text-yellow-600 mt-1">+{referralData?.rewards?.referrer || 500} pts pending</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiMessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No referrals yet</p>
                <p className="text-sm text-gray-400">Share your link to start earning!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
              Top Referrers
            </h2>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                          : index === 1
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          : index === 2
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <span className="font-medium dark:text-white">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{entry.referrals}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{entry.earnings} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards Info */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Rewards</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>You get</span>
                <span className="font-bold text-2xl">{referralData?.rewards?.referrer} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Friend gets</span>
                <span className="font-bold text-2xl">{referralData?.rewards?.referred} pts</span>
              </div>
              <hr className="border-white/30" />
              <p className="text-sm text-white/80">
                Points are awarded when your friend makes their first purchase. No limit on referrals!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
