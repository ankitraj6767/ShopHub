import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiZap, FiClock, FiActivity, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { addToCart } from '../../store/slices/cartSlice';

// Using FiActivity as alternative to BsFire
import api from '../../utils/api';

const FlashSale = () => {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchFlashSale();
  }, []);

  useEffect(() => {
    if (!flashSale) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(flashSale.endTime).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ expired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  const fetchFlashSale = async () => {
    try {
      const { data } = await api.get('/flash-sales/live');
      setFlashSale(data.data);
    } catch (error) {
      console.error('Error fetching flash sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    const remaining = item.quantity - item.sold;
    if (remaining <= 0) {
      toast.error('This flash sale item is sold out');
      return;
    }
    
    // Create product object with flash sale price
    const productWithSalePrice = {
      _id: item.product._id,
      name: item.product.name,
      price: item.originalPrice,
      images: item.product.images,
      stock: remaining,
    };
    
    dispatch(addToCart({ 
      product: productWithSalePrice, 
      quantity: 1,
      salePrice: item.salePrice 
    }));
    toast.success(`${item.product.name} added to cart at flash sale price!`);
  };

  if (loading) {
    return null;
  }

  if (!flashSale) {
    return null;
  }

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-red-600 text-white px-3 py-2 rounded-lg min-w-[50px] text-center">
        <span className="text-xl font-bold">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
    </div>
  );

  return (
    <section className="py-8 bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-full animate-pulse">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{flashSale.name}</h2>
                <FiActivity className="w-6 h-6 text-orange-500 animate-bounce" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{flashSale.description || 'Limited time offers!'}</p>
            </div>
          </div>

          {/* Countdown Timer */}
          {!timeLeft.expired && (
            <div className="flex items-center gap-2">
              <FiClock className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Ends in:</span>
              <div className="flex gap-2">
                {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="Days" />}
                <TimeBox value={timeLeft.hours} label="Hours" />
                <TimeBox value={timeLeft.minutes} label="Mins" />
                <TimeBox value={timeLeft.seconds} label="Secs" />
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(flashSale.products || []).slice(0, 5).map((item) => {
            const discount = Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100);
            const remaining = item.quantity - item.sold;
            const soldPercentage = (item.sold / item.quantity) * 100;
            const isSoldOut = remaining <= 0;

            return (
              <div
                key={item.product._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group relative"
              >
                {/* Discount Badge */}
                <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discount}%
                </div>

                {/* Sold Out Badge */}
                {isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                    <span className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold">SOLD OUT</span>
                  </div>
                )}

                {/* Product Image - Clickable */}
                <Link to={`/products/${item.product._id}`}>
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-3">
                  <Link to={`/products/${item.product._id}`}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2 hover:text-primary-600">
                      {item.product.name}
                    </h3>
                  </Link>

                  {/* Prices */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-red-600">₹{item.salePrice.toFixed(2)}</span>
                    <span className="text-sm text-gray-400 line-through">₹{item.originalPrice.toFixed(2)}</span>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="relative mb-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{item.sold} sold</span>
                      <span>{remaining} left</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => handleAddToCart(e, item)}
                    disabled={isSoldOut}
                    className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      isSoldOut 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    <FiShoppingCart className="w-4 h-4" />
                    {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <Link
            to={`/flash-sale/${flashSale._id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            View All Deals
            <FiZap className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
