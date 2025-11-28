import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchWishlist,
  removeFromWishlist,
  clearWishlist,
  selectWishlistItems,
  selectWishlistLoading,
  selectWishlistError,
} from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import Spinner from '../components/ui/Spinner';
import { formatPrice } from '../utils/helpers';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectWishlistItems) || [];
  const loading = useSelector(selectWishlistLoading) || false;
  const error = useSelector(selectWishlistError) || null;

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleRemove = (productId) => {
    if (window.confirm('Remove this item from your wishlist?')) {
      dispatch(removeFromWishlist(productId));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all items from your wishlist?')) {
      dispatch(clearWishlist());
    }
  };

  const handleAddToCart = (product) => {
    dispatch(
      addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        stock: product.stock,
        quantity: 1,
      })
    );
  };

  const handleMoveAllToCart = () => {
    items.forEach((item) => {
      if (item.product?.stock > 0) {
        handleAddToCart(item.product);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
          {items.length > 0 && (
            <div className="flex space-x-4">
              <button
                onClick={handleMoveAllToCart}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add All to Cart
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Clear Wishlist
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Start adding items you love to your wishlist!
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={product._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/products/${product._id}`}>
                    <div className="aspect-w-1 aspect-h-1">
                      <img
                        src={product.images?.[0]?.url || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/products/${product._id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 truncate">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xl font-bold text-indigo-600">
                        {formatPrice(product.price)}
                      </span>
                      <span
                        className={`text-sm ${
                          product.stock > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 truncate">
                        Note: {item.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
                      <span>
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                      {item.priority && item.priority !== 'medium' && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full ${
                            item.priority === 'high'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.priority}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(product._id)}
                        className="px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
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

export default WishlistPage;
