import { Link } from 'react-router-dom';
import { FiShoppingCart, FiStar, FiHeart, FiEye } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from '../../store/slices/wishlistSlice';
import { addToCompare, removeFromCompare } from '../../store/slices/compareSlice';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useState } from 'react';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product, listView = false }) => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth) || {};
  const { isAuthenticated = false } = authState;
  const isInWishlist = useSelector(selectIsInWishlist(product?._id));
  const compareProducts = useSelector((state) => state.compare?.products || []);
  const isInCompare = product ? compareProducts.some((p) => p._id === product._id) : false;
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  // Return null if product is not provided
  if (!product || !product._id) {
    return null;
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success('Added to cart');
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist({ productId: product._id })).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error || 'Failed to update wishlist');
      } finally {
      setWishlistLoading(false);
    }
  };

  const handleToggleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCompare) {
      dispatch(removeFromCompare(product._id));
      toast.success('Removed from compare');
    } else {
      if (compareProducts.length >= 4) {
        toast.error('You can compare up to 4 products');
        return;
      }
      dispatch(addToCompare(product));
      toast.success('Added to compare');
    }
  };

  // List View Layout
  if (listView) {
    return (
      <Link to={`/products/${product._id}`} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative w-full sm:w-48 md:w-56 lg:w-64 aspect-square sm:aspect-auto sm:h-48 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={product.images?.[0]?.url || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400?text=Product';
              }}
            />
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.featured && (
                <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded font-medium">Featured</span>
              )}
              {product.stock === 0 && (
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">Out of Stock</span>
              )}
            </div>
            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                className={`p-2 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500 ${
                  isInWishlist ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-red-500'
                }`}
              >
                <FiHeart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleToggleCompare}
                title={isInCompare ? "Remove from Compare" : "Add to Compare"}
                aria-label={isInCompare ? "Remove from Compare" : "Add to Compare"}
                className={`p-2 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500 ${
                  isInCompare ? 'bg-purple-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300 hover:text-purple-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col">
            <div className="flex-1">
              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">{product.brand}</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">({product.numReviews} reviews)</span>
              </div>
              {product.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{product.description}</p>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
              <div>
                <span className="text-2xl font-bold text-primary-600">{formatPrice(product.price)}</span>
                {product.stock > 0 && product.stock <= 10 && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Only {product.stock} left in stock</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickView(true);
                  }}
                  className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500"
                  title="Quick View"
                  aria-label="Quick View"
                >
                  <FiEye className="w-5 h-5" />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  aria-label="Add to Cart"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <QuickViewModal product={product} isOpen={showQuickView} onClose={() => setShowQuickView(false)} />
      </Link>
    );
  }

  // Grid View Layout (Default)
  return (
    <Link to={`/products/${product._id}`} className="card group">
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={product.images?.[0]?.url || '/placeholder.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400?text=Product';
          }}
        />
        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500 ${
            isInWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-red-500'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
        {/* Compare Button */}
        <button
          onClick={handleToggleCompare}
          className={`absolute top-12 right-2 p-2 rounded-full transition-all transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500 ${
            isInCompare
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg ring-2 ring-purple-300'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-purple-500'
          }`}
          title={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
          aria-label={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        {/* Quick View Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowQuickView(true);
          }}
          className="absolute top-[88px] right-2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-primary-500 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500"
          title="Quick View"
          aria-label="Quick View"
        >
          <FiEye className="w-5 h-5" />
        </button>
        {product.featured && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
            Featured
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition">
          {product.name}
        </h3>
        <div className="flex items-center mb-2">
          <div className="flex items-center text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            ({product.numReviews})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label="Add to Cart"
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-primary-500"
          >
            <FiShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </Link>
  );
};

export default ProductCard;
