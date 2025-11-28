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

const ProductCard = ({ product }) => {
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

  return (
    <Link to={`/products/${product._id}`} className="card group">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
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
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            isInWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
        {/* Compare Button */}
        <button
          onClick={handleToggleCompare}
          className={`absolute top-12 right-2 p-2 rounded-full transition-all ${
            isInCompare
              ? 'bg-blue-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-blue-500'
          }`}
          title={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
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
          className="absolute top-[88px] right-2 p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white hover:text-primary-500 transition-all opacity-0 group-hover:opacity-100"
          title="Quick View"
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
        <p className="text-sm text-gray-500 mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition">
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
          <span className="text-sm text-gray-500 ml-2">
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
            className="p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
