import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiZap, FiShoppingCart } from 'react-icons/fi';
import { formatPrice } from '../../utils/helpers';
import api from '../../utils/api';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import toast from 'react-hot-toast';

const DealOfTheDay = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    if (deals.length > 0 && deals[0].endDate) {
      const timer = setInterval(() => {
        calculateTimeLeft(deals[0].endDate);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      // Default to end of day if no specific end date
      const timer = setInterval(() => {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        calculateTimeLeft(endOfDay);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [deals]);

  const fetchDeals = async () => {
    try {
      // Fetch deals from the deals API
      const response = await api.get('/deals/today');
      const fetchedDeals = response.data.data || [];
      
      if (fetchedDeals.length > 0) {
        setDeals(fetchedDeals);
      } else {
        // Fallback: fetch featured products if no deals are set
        const productResponse = await api.get('/products?limit=4&sort=-createdAt');
        const products = productResponse.data.data || [];
        const fallbackDeals = products.map(p => ({
          _id: p._id,
          product: p,
          originalPrice: Math.round(p.price * 1.3),
          salePrice: p.price,
          discountPercent: 30,
          isFallback: true
        }));
        setDeals(fallbackDeals);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      // Fallback on error
      try {
        const productResponse = await api.get('/products?limit=4&sort=-createdAt');
        const products = productResponse.data.data || [];
        const fallbackDeals = products.map(p => ({
          _id: p._id,
          product: p,
          originalPrice: Math.round(p.price * 1.3),
          salePrice: p.price,
          discountPercent: 30,
          isFallback: true
        }));
        setDeals(fallbackDeals);
      } catch (err) {
        console.error('Failed to fetch fallback products');
      }
    }
    setLoading(false);
  };

  const calculateTimeLeft = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    
    const difference = end - now;
    
    if (difference > 0) {
      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    } else {
      setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
    }
  };

  const handleAddToCart = (e, deal) => {
    e.preventDefault();
    e.stopPropagation();
    
    const product = deal.product;
    if (!product) return;
    
    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      price: deal.salePrice,
      image: product.images?.[0]?.url || 'https://via.placeholder.com/300',
      quantity: 1,
      stock: product.stock
    }));
    toast.success('Added to cart!');
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
          {deals.map((deal) => {
            const product = deal.product || deal;
            const productId = product._id || deal._id;
            const productName = product.name || 'Product';
            const productImage = product.images?.[0]?.url || 'https://via.placeholder.com/300';
            const discount = deal.discountPercent || Math.round(((deal.originalPrice - deal.salePrice) / deal.originalPrice) * 100);
            const soldCount = deal.soldCount || 0;
            const purchaseLimit = deal.purchaseLimit || 0;
            const stockLeft = purchaseLimit > 0 ? purchaseLimit - soldCount : null;
            
            return (
              <Link
                key={deal._id}
                to={`/products/${productId}`}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition group"
              >
                <div className="relative">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-40 object-cover group-hover:scale-105 transition"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                  {stockLeft !== null && stockLeft <= 10 && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Only {stockLeft} left!
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{productName}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-red-600">{formatPrice(deal.salePrice)}</span>
                    <span className="text-sm text-gray-400 line-through">{formatPrice(deal.originalPrice)}</span>
                  </div>
                  
                  {/* Progress bar for stock */}
                  {purchaseLimit > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Sold: {soldCount}</span>
                        <span>Available: {stockLeft}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((soldCount / purchaseLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={(e) => handleAddToCart(e, deal)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DealOfTheDay;
