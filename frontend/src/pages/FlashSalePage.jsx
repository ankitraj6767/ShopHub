import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiZap, FiClock, FiShoppingCart, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { addToCart } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const FlashSalePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [flashSale, setFlashSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    fetchFlashSale();
  }, [id]);

  useEffect(() => {
    if (!flashSale) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(flashSale.endTime).getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setTimeLeft({ expired: true });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  const fetchFlashSale = async () => {
    try {
      const { data } = await api.get(`/flash-sales/${id}`);
      setFlashSale(data.data);
    } catch (error) {
      console.error('Error fetching flash sale:', error);
      toast.error('Flash sale not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const remaining = item.quantity - item.sold;
    if (remaining <= 0) {
      toast.error('This item is sold out');
      return;
    }

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
      salePrice: item.salePrice,
    }));
    toast.success(`${item.product.name} added to cart at flash sale price!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!flashSale) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiZap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Flash Sale Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">This flash sale may have ended or doesn't exist.</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  const TimeBox = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg min-w-[60px] text-center">
        <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6">
        <FiArrowLeft className="mr-2" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FiZap className="w-8 h-8" />
              <h1 className="text-3xl font-bold">{flashSale.name}</h1>
            </div>
            <p className="text-white/80">{flashSale.description || 'Limited time offers with massive discounts!'}</p>
          </div>

          {/* Countdown Timer */}
          {!timeLeft.expired ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiClock className="w-5 h-5" />
                <span className="font-medium">Sale Ends In:</span>
              </div>
              <div className="flex gap-3">
                {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="Days" />}
                <TimeBox value={timeLeft.hours} label="Hours" />
                <TimeBox value={timeLeft.minutes} label="Mins" />
                <TimeBox value={timeLeft.seconds} label="Secs" />
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <p className="text-xl font-bold">Sale Ended</p>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {flashSale.products.map((item) => {
          const discount = Math.round(((item.originalPrice - item.salePrice) / item.originalPrice) * 100);
          const remaining = item.quantity - item.sold;
          const soldPercentage = (item.sold / item.quantity) * 100;
          const isSoldOut = remaining <= 0;

          return (
            <div
              key={item.product._id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </div>

              {/* Sold Out Overlay */}
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                  <span className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold text-lg">SOLD OUT</span>
                </div>
              )}

              {/* Product Image */}
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
              <div className="p-4">
                <Link to={`/products/${item.product._id}`}>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2">
                    {item.product.name}
                  </h3>
                </Link>

                {/* Rating */}
                {item.product.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.product.rating.toFixed(1)} ({item.product.numReviews})
                    </span>
                  </div>
                )}

                {/* Prices */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-red-600">{formatPrice(item.salePrice)}</span>
                  <span className="text-sm text-gray-400 line-through">{formatPrice(item.originalPrice)}</span>
                </div>

                {/* Stock Progress Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                      style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{item.sold} sold</span>
                    <span>{remaining} left</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={isSoldOut || timeLeft.expired}
                  className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    isSoldOut || timeLeft.expired
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <FiShoppingCart className="w-4 h-4" />
                  {isSoldOut ? 'Sold Out' : timeLeft.expired ? 'Sale Ended' : 'Add to Cart'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {flashSale.products.length === 0 && (
        <div className="text-center py-16">
          <FiZap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No products in this flash sale.</p>
        </div>
      )}
    </div>
  );
};

export default FlashSalePage;
