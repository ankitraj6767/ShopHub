import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiShoppingCart, FiArrowLeft, FiCheck, FiPercent, FiZap, FiHome, FiGrid } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { addToCart, setBuyNowItems } from '../store/slices/cartSlice';
import { formatPrice } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const BundleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const { data } = await api.get(`/bundles/${id}`);
      setBundle(data.data);
    } catch (error) {
      console.error('Error fetching bundle:', error);
      toast.error('Bundle not found');
    } finally {
      setLoading(false);
    }
  };

  const addBundleItemsToCart = () => {
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
        // Calculate individual product's discounted price based on bundle discount
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

  const handleAddBundleToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    const addedCount = addBundleItemsToCart();
    if (addedCount > 0) {
      toast.success(`Bundle "${bundle.name}" added to cart!`);
    } else {
      toast.error('Could not add bundle to cart');
    }
  };

  const handleBuyNow = () => {
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

  if (!bundle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiPackage className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bundle Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">This bundle may have been removed or doesn't exist.</p>
        <Link to="/bundles" className="btn-primary">
          View All Bundles
        </Link>
      </div>
    );
  }

  const savings = bundle.originalPrice - bundle.bundlePrice;
  const discountPercent = Math.round((savings / bundle.originalPrice) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Breadcrumbs */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <Link to="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600">
          <FiHome className="w-4 h-4" />
          Home
        </Link>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <Link to="/bundles" className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600">
          <FiPackage className="w-4 h-4" />
          Bundles
        </Link>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{bundle.name}</span>
      </div>

      {/* Quick Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiHome className="inline w-3 h-3 mr-1" /> Home
        </Link>
        <Link to="/products" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiGrid className="inline w-3 h-3 mr-1" /> Products
        </Link>
        <Link to="/bundles" className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/40 rounded-full text-sm text-primary-700 dark:text-primary-300 transition-colors">
          <FiPackage className="inline w-3 h-3 mr-1" /> All Bundles
        </Link>
        <Link to="/cart" className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors">
          <FiShoppingCart className="inline w-3 h-3 mr-1" /> Cart
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bundle Image */}
        <div className="bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-2xl p-8 flex items-center justify-center">
          {bundle.image ? (
            <img
              src={bundle.image}
              alt={bundle.name}
              className="max-w-full max-h-[400px] object-contain rounded-xl"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {bundle.products.slice(0, 4).map((item, index) => (
                <div key={index} className="aspect-square bg-white rounded-xl p-4 shadow-md">
                  <img
                    src={item.product?.images?.[0]?.url || '/placeholder.png'}
                    alt={item.product?.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bundle Info */}
        <div>
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <FiPackage className="w-4 h-4" />
              Bundle Deal
            </span>
            {bundle.featured && (
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{bundle.name}</h1>
          
          {bundle.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-6">{bundle.description}</p>
          )}

          {/* Pricing */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bundle Price</p>
                <p className="text-4xl font-bold text-green-600">{formatPrice(bundle.bundlePrice)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Original Price</p>
                <p className="text-2xl text-gray-400 line-through">{formatPrice(bundle.originalPrice)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-2">
              <FiPercent className="w-5 h-5" />
              <span className="font-bold">You Save {formatPrice(savings)} ({discountPercent}% off)</span>
            </div>
          </div>

          {/* Products in Bundle */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What's Included ({bundle.products.length} items)</h3>
            <div className="space-y-3">
              {bundle.products.map((item, index) => {
                const originalItemPrice = item.product?.price * (item.quantity || 1);
                // Calculate discount from bundle prices
                const bundleDiscountPercent = bundle.originalPrice > 0 
                  ? ((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100 
                  : 0;
                const discountedItemPrice = originalItemPrice * (1 - bundleDiscountPercent / 100);
                
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <img
                      src={item.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <Link 
                        to={`/products/${item.product?._id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-primary-600"
                      >
                        {item.product?.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(discountedItemPrice)}</p>
                      <p className="text-sm text-gray-400 line-through">{formatPrice(originalItemPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Free Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Bundle Discount Applied</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>All Items Included</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FiCheck className="w-5 h-5 text-green-500" />
                <span>Save {discountPercent}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleAddBundleToCart}
              className="flex-1 bg-white border-2 border-primary-600 text-primary-600 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
            >
              <FiShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-gradient-to-r from-primary-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-primary-700 hover:to-purple-700 transition-colors shadow-lg"
            >
              <FiZap className="w-5 h-5" />
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetailsPage;
