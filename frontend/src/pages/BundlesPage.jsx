import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiShoppingCart, FiPercent, FiArrowLeft, FiZap, FiHome, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { addToCart, setBuyNowItems } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const BundlesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data } = await api.get('/bundles');
      setBundles(data.data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBundleItemsToCart = (bundle) => {
    let addedCount = 0;
    
    // Calculate discount percentage from bundle prices if not provided
    const discountPercent = bundle.discountPercentage || 
      (bundle.originalPrice && bundle.bundlePrice 
        ? Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100) 
        : 0);
    
    // Add each product in the bundle to cart with discounted price
    bundle.products.forEach((item) => {
      const product = item.product;
      if (product && product._id) {
        const productStock = product.stock || 10; // Default stock if not provided
        const discountedPrice = product.price * (1 - discountPercent / 100);
        
        dispatch(addToCart({
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images || [],
            stock: productStock,
          },
          quantity: item.quantity || 1,
          salePrice: Math.round(discountedPrice * 100) / 100,
        }));
        addedCount++;
      }
    });
    
    return addedCount;
  };

  const handleAddBundleToCart = (bundle) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const addedCount = addBundleItemsToCart(bundle);
    if (addedCount > 0) {
      toast.success(`Bundle "${bundle.name}" added to cart!`);
    } else {
      toast.error('Could not add bundle to cart');
    }
  };

  const handleBuyNow = (bundle) => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    // Prepare bundle items for direct checkout
    const bundleItems = bundle.products
      .filter(item => item.product && item.product.stock > 0)
      .map(item => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.discountedPrice || item.product.price,
        originalPrice: item.product.price,
        image: item.product.images?.[0]?.url || '/placeholder.jpg',
        stock: item.product.stock,
        quantity: item.quantity || 1,
        isOnSale: item.discountedPrice < item.product.price,
      }));

    if (bundleItems.length > 0) {
      dispatch(setBuyNowItems(bundleItems));
      toast.success(`Bundle "${bundle.name}" ready for checkout!`);
      navigate('/checkout?buyNow=true');
    } else {
      toast.error('No available items in this bundle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <Link to="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
          <FiHome className="w-4 h-4" />
          Home
        </Link>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <span className="text-gray-900 dark:text-white font-medium">Bundles</span>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiHome className="inline w-3 h-3 mr-1" /> Home
        </Link>
        <Link to="/products" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiGrid className="inline w-3 h-3 mr-1" /> Products
        </Link>
        <Link to="/cart" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiShoppingCart className="inline w-3 h-3 mr-1" /> Cart
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <FiPackage className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Product Bundles</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Save more with our specially curated product bundles. Get everything you need at discounted prices!
        </p>
      </div>

      {bundles.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Bundles Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Check back later for exciting bundle deals!</p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bundles.map((bundle) => {
            const savings = bundle.originalPrice - bundle.bundlePrice;
            const discountPercent = Math.round((savings / bundle.originalPrice) * 100);

            return (
              <div
                key={bundle._id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Bundle Image */}
                <div className="relative bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 p-6 h-48">
                  {/* Discount Badge */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <FiPercent className="w-4 h-4" />
                    Save {discountPercent}%
                  </div>

                  {bundle.featured && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Featured
                    </div>
                  )}

                  <div className="flex items-center justify-center h-full">
                    <div className="grid grid-cols-2 gap-2 max-w-[180px]">
                      {bundle.products.slice(0, 4).map((item, index) => (
                        <div key={index} className="aspect-square bg-white rounded-lg p-2 shadow-sm">
                          <img
                            src={item.product?.images?.[0]?.url || '/placeholder.png'}
                            alt={item.product?.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bundle Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <FiPackage className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-primary-600 font-medium">
                      {bundle.products.length} items
                    </span>
                  </div>

                  <Link to={`/bundles/${bundle._id}`}>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {bundle.name}
                    </h3>
                  </Link>

                  {bundle.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{bundle.description}</p>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-green-600">{formatPrice(bundle.bundlePrice)}</span>
                    <span className="text-lg text-gray-400 line-through">{formatPrice(bundle.originalPrice)}</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddBundleToCart(bundle)}
                        className="flex-1 py-2.5 border border-primary-600 text-primary-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
                      >
                        <FiShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuyNow(bundle)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-primary-700 hover:to-purple-700 transition-colors"
                      >
                        <FiZap className="w-4 h-4" />
                        Buy Now
                      </button>
                    </div>
                    <Link
                      to={`/bundles/${bundle._id}`}
                      className="block w-full py-2 text-center text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BundlesPage;
