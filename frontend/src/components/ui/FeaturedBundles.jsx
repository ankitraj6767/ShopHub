import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiGift, FiPackage, FiPercent, FiShoppingCart, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { addToCart, setBuyNowItems } from '../../store/slices/cartSlice';

const FeaturedBundles = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data } = await api.get('/bundles/featured');
      setBundles(data.data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || bundles.length === 0) {
    return null;
  }

  const addBundleItemsToCart = (bundle) => {
    let addedCount = 0;
    
    // Calculate discount percentage from bundle prices if not provided
    const discountPercent = bundle.discountPercentage || 
      (bundle.originalPrice && bundle.bundlePrice 
        ? Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100) 
        : 0);
    
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

  const handleAddToCart = (e, bundle) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const handleBuyNow = (e, bundle) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    // Calculate discount percentage from bundle prices if not provided
    const discountPercent = bundle.discountPercentage || 
      (bundle.originalPrice && bundle.bundlePrice 
        ? Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100) 
        : 0);

    // Prepare bundle items for direct checkout
    const bundleItems = bundle.products
      .filter(item => item.product && item.product._id)
      .map(item => {
        const product = item.product;
        const discountedPrice = product.price * (1 - discountPercent / 100);
        return {
          _id: product._id,
          name: product.name,
          price: discountedPrice,
          originalPrice: product.price,
          image: product.images?.[0]?.url || '/placeholder.jpg',
          stock: product.stock || 10,
          quantity: item.quantity || 1,
          isOnSale: discountPercent > 0,
        };
      });

    if (bundleItems.length > 0) {
      dispatch(setBuyNowItems(bundleItems));
      toast.success(`Bundle "${bundle.name}" ready for checkout!`);
      navigate('/checkout?buyNow=true');
    } else {
      toast.error('No available items in this bundle');
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-600 rounded-2xl mb-4">
            <FiPackage className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bundle & Save</h2>
          <p className="text-gray-600">Get more for less with our exclusive product bundles</p>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bundles.map((bundle) => {
            const savings = bundle.originalPrice - bundle.bundlePrice;
            const discountPercent = bundle.discountPercentage || Math.round((savings / bundle.originalPrice) * 100);
            
            return (
              <div
                key={bundle._id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Savings Badge */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <FiPercent className="w-4 h-4" />
                    <span className="font-bold">Save {discountPercent}%</span>
                  </div>
                </div>

                {/* Bundle Image/Products Preview */}
                <Link to={`/bundles/${bundle._id}`} className="block p-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {bundle.products.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={item.product?.images?.[0]?.url || '/placeholder.png'}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Bundle Info */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {bundle.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {bundle.description || `${bundle.products.length} products included`}
                  </p>

                  {/* Prices */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">${bundle.bundlePrice?.toFixed(2)}</span>
                      <span className="text-sm text-gray-400 line-through ml-2">${bundle.originalPrice?.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      Save ${savings.toFixed(2)}
                    </div>
                  </div>
                </Link>

                {/* CTA Buttons */}
                <div className="px-4 pb-4 space-y-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleAddToCart(e, bundle)}
                      className="flex-1 py-2 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <FiShoppingCart className="w-4 h-4" />
                      Cart
                    </button>
                    <button 
                      onClick={(e) => handleBuyNow(e, bundle)}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <FiZap className="w-4 h-4" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All */}
        <div className="text-center mt-8">
          <Link
            to="/bundles"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700"
          >
            View All Bundles
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBundles;
