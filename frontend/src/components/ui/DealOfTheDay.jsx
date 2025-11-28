import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiZap } from 'react-icons/fi';
import { formatPrice } from '../../utils/helpers';
import api from '../../utils/api';

const DealOfTheDay = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDeals = async () => {
    try {
      // Fetch products with discount (simulating deals)
      const response = await api.get('/products?limit=4&sort=-createdAt');
      const products = response.data.data || [];
      // Add fake discount for demo
      const dealsWithDiscount = products.map(p => ({
        ...p,
        originalPrice: p.price * 1.3,
        discount: 30,
      }));
      setDeals(dealsWithDiscount);
    } catch (error) {
      console.error('Failed to fetch deals');
    }
    setLoading(false);
  };

  const calculateTimeLeft = () => {
    // Deal ends at midnight
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const difference = endOfDay - now;
    
    if (difference > 0) {
      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }
  };

  if (loading || deals.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-r from-red-500 to-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <FiZap className="w-8 h-8 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Deal of the Day</h2>
          </div>
          
          {/* Countdown Timer */}
          <div className="flex items-center gap-2 text-white">
            <FiClock className="w-5 h-5" />
            <span className="font-medium">Ends in:</span>
            <div className="flex gap-2">
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded">
                <span className="font-bold text-xl">{String(timeLeft.hours || 0).padStart(2, '0')}</span>
                <span className="text-xs ml-1">hrs</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded">
                <span className="font-bold text-xl">{String(timeLeft.minutes || 0).padStart(2, '0')}</span>
                <span className="text-xs ml-1">min</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded">
                <span className="font-bold text-xl">{String(timeLeft.seconds || 0).padStart(2, '0')}</span>
                <span className="text-xs ml-1">sec</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {deals.map((deal) => (
            <Link
              key={deal._id}
              to={`/products/${deal._id}`}
              className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition group"
            >
              <div className="relative">
                <img
                  src={deal.images?.[0]?.url || 'https://via.placeholder.com/300'}
                  alt={deal.name}
                  className="w-full h-40 object-cover group-hover:scale-105 transition"
                />
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  -{deal.discount}%
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{deal.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-600">{formatPrice(deal.price)}</span>
                  <span className="text-sm text-gray-400 line-through">{formatPrice(deal.originalPrice)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealOfTheDay;
