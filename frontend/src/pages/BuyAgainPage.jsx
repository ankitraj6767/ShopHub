import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBuyAgainItems } from '../store/slices/orderSlice';
import { addToCart } from '../store/slices/cartSlice';
import { ShoppingCart, Package, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import Rating from '../components/ui/Rating';

const BuyAgainPage = () => {
  const dispatch = useDispatch();
  const { buyAgainItems, isLoading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchBuyAgainItems());
  }, [dispatch]);

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Buy Again
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quickly reorder products you've purchased before
          </p>
        </div>

        {buyAgainItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No previous purchases yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Once you've made purchases, they'll appear here for easy reordering.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Start Shopping
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {buyAgainItems.map((item) => (
              <div
                key={item.product._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition group"
              >
                {/* Product Image */}
                <Link to={`/products/${item.product._id}`} className="block relative">
                  <img
                    src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                    alt={item.product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                  />
                  {item.purchaseCount > 1 && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Bought {item.purchaseCount}x
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link
                    to={`/products/${item.product._id}`}
                    className="text-lg font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                  >
                    {item.product.name}
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <Rating value={item.product.rating} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({item.product.numReviews})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ₹{item.product.price?.toFixed(2)}
                    </span>
                    {item.priceChanged && item.lastPurchasePrice !== item.product.price && (
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 line-through">
                        ₹{item.lastPurchasePrice?.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Last Purchase Date */}
                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    Last ordered: {formatDate(item.lastPurchaseDate)}
                  </div>

                  {/* Stock Status */}
                  <div className="mt-3">
                    {item.product.stock > 0 ? (
                      <span className="text-sm text-green-600 dark:text-green-400">
                        In Stock ({item.product.stock} available)
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 dark:text-red-400">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item.product)}
                    disabled={item.product.stock === 0}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/orders"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
          >
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
              <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Your Orders</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View order history</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
          </Link>

          <Link
            to="/premium"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
          >
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Premium Membership</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get extra discounts</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
          </Link>

          <Link
            to="/wishlist"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition flex items-center gap-4"
          >
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Your Wishlist</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Items you've saved</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyAgainPage;
