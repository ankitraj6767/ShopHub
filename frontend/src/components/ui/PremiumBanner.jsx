import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaCrown, FaTimes } from 'react-icons/fa';
import api from '../../utils/api';

const PremiumBanner = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [isPremium, setIsPremium] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!userInfo) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/premium/status');
        setIsPremium(data.isPremium);
      } catch (error) {
        console.error('Failed to check premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [userInfo]);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('premiumBannerDismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('premiumBannerDismissed', 'true');
  };

  // Don't show if loading, already premium, or dismissed
  if (loading || isPremium || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <FaCrown className="text-white animate-pulse" />
        <span className="font-medium">
          Join ShopHub Premium and get up to 15% off on all products!
        </span>
        <Link
          to="/premium"
          className="ml-2 bg-white text-orange-500 px-3 py-0.5 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
        >
          Learn More
        </Link>
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white"
          aria-label="Dismiss banner"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default PremiumBanner;
