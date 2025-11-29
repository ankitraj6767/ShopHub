import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCrown } from 'react-icons/fa';
import api from '../../utils/api';

const PremiumPriceBadge = ({ originalPrice, className = '' }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [premiumData, setPremiumData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPremiumStatus = async () => {
      if (!userInfo) return;
      
      setLoading(true);
      try {
        const { data } = await api.get('/premium/benefits');
        if (data.isPremium) {
          setPremiumData(data.benefits);
        }
      } catch (error) {
        console.error('Failed to fetch premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumStatus();
  }, [userInfo]);

  if (loading || !premiumData) {
    return null;
  }

  const discountAmount = (originalPrice * premiumData.discountPercent) / 100;
  const discountedPrice = originalPrice - discountAmount;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-1 text-yellow-500">
        <FaCrown className="text-xs" />
        <span className="text-xs font-medium">Premium Price</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-600 dark:text-green-400">
          ₹{discountedPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
        <span className="text-xs text-gray-500 line-through">
          ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
        <span className="text-xs font-medium text-green-500 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
          {premiumData.discountPercent}% OFF
        </span>
      </div>
    </div>
  );
};

export default PremiumPriceBadge;
