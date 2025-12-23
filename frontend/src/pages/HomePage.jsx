import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiHeadphones, FiAward, FiGift } from 'react-icons/fi';
import { fetchProducts, fetchFeaturedProducts, fetchCategories } from '../store/slices/productSlice';
import ProductCard from '../components/ui/ProductCard';
import Spinner from '../components/ui/Spinner';
import DealOfTheDay from '../components/ui/DealOfTheDay';
import FlashSale from '../components/ui/FlashSale';
import FeaturedBundles from '../components/ui/FeaturedBundles';
import Testimonials from '../components/ui/Testimonials';
import PersonalizedDashboard from '../components/ui/PersonalizedDashboard';
import SmartRecommendations from '../components/ui/SmartRecommendations';
import QuickBuySection from '../components/ui/QuickBuySection';
import toast from 'react-hot-toast';

const HomePage = () => {
  const dispatch = useDispatch();
  const productsState = useSelector((state) => state.products) || {};
  const { products = [], featuredProducts = [], categories = [], isLoading = false } = productsState;
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts({ limit: 10, sort: 'rating' })); // Fetch top 10 best rated products
    dispatch(fetchFeaturedProducts(8)); // Fetch 8 featured products
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    
    setSubscribing(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
      setSubscribing(false);
    }, 1000);
  };

  const features = [
    {
      icon: FiTruck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over ₹5000',
    },
    {
      icon: FiShield,
      title: 'Secure Payment',
      description: '100% secure payment processing',
    },
    {
      icon: FiHeadphones,
      title: '24/7 Support',
      description: 'Dedicated support team ready to help',
    },
    {
      icon: FiAward,
      title: 'Loyalty Rewards',
      description: 'Earn points on every purchase',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Discover Amazing Products
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8">
              Shop the latest trends with exclusive deals. Quality products at unbeatable prices.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/products" className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3">
                Shop Now
              </Link>
              <Link to="/products?featured=true" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3">
                Featured Products
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Features */}
      <section className="py-12 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      <FlashSale />

      {/* Personalized Dashboard */}
      <PersonalizedDashboard />

      {/* Quick Reorder Section */}
      <QuickBuySection />

      {/* Deal of the Day */}
      <DealOfTheDay />

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center">
              View All <FiArrowRight className="ml-2" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(categories || []).slice(0, 5).map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-600 transition">
                  <span className="text-2xl group-hover:scale-110 transition">
                    {category === 'Electronics' && '📱'}
                    {category === 'Clothing' && '👕'}
                    {category === 'Home & Garden' && '🏠'}
                    {category === 'Sports & Outdoors' && '⚽'}
                    {category === 'Books' && '📚'}
                    {category === 'Toys & Games' && '🎮'}
                    {category === 'Health & Beauty' && '💄'}
                    {category === 'Automotive' && '🚗'}
                    {category === 'Food & Grocery' && '🍎'}
                    {category === 'Other' && '📦'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">⭐ Featured Products</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Hand-picked products just for you</p>
            </div>
            <Link to="/products?featured=true" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
              View All Featured <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          {isLoading ? (
            <Spinner size="lg" className="py-12" />
          ) : featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product) => (
                product && <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">No featured products available</p>
          )}
        </div>
      </section>

      {/* All Products Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">🔥 Best Sellers</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Top rated products by our customers</p>
            </div>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
              Browse All Products <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          {isLoading ? (
            <Spinner size="lg" className="py-12" />
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.slice(0, 10).map((product) => (
                product && <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">No products available</p>
          )}
        </div>
      </section>

      {/* Featured Bundles */}
      <FeaturedBundles />

      {/* Smart Recommendations */}
      <SmartRecommendations />

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Newsletter
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              type="submit" 
              disabled={subscribing}
              className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 disabled:opacity-50"
            >
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
