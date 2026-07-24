import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiX, FiMinus, FiPlus, FiHeart, FiShoppingCart, FiStar, FiTruck, FiShield, FiPackage } from 'react-icons/fi';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from '../../store/slices/wishlistSlice';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const isInWishlist = useSelector((state) => selectIsInWishlist(state, product?._id));
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    dispatch(addToCart({
      _id: product._id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.images?.[0] || product.image,
      quantity,
      stock: product.stock,
    }));
    toast.success('Added to cart!');
    onClose();
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product._id));
      toast.success('Added to wishlist');
    }
  };

  const images = product.images?.length > 0 ? product.images : [product.image || '/placeholder.png'];
  const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <FiX className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto max-h-[90vh]">
          {/* Image Gallery */}
          <div className="p-6 bg-gray-50">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white mb-4">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discount}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`View image ${idx + 1}`}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                      selectedImage === idx ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-6 flex flex-col">
            <div className="flex-1">
              {/* Category & Rating */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-primary-600 font-medium">{product.category}</span>
                <div className="flex items-center gap-1 text-sm">
                  <FiStar className="text-yellow-400 fill-current" />
                  <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400">({product.numReviews || 0})</span>
                </div>
              </div>

              {/* Name */}
              <h2 id="quick-view-title" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {formatPrice(product.salePrice || product.price)}
                </span>
                {product.salePrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">{product.description}</p>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    In Stock ({product.stock} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-red-600 font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FiTruck className="w-5 h-5 text-primary-500 mb-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 text-center">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FiShield className="w-5 h-5 text-primary-500 mb-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 text-center">1 Year Warranty</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <FiPackage className="w-5 h-5 text-primary-500 mb-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-300 text-center">Easy Returns</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                <div className="flex items-center border dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    disabled={quantity <= 1}
                  >
                    <FiMinus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="w-12 text-center font-medium dark:text-white" aria-live="polite" aria-atomic="true">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    aria-label="Increase quantity"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    disabled={quantity >= product.stock}
                  >
                    <FiPlus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiShoppingCart />
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlist}
                  aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  className={`p-3 rounded-lg border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    isInWishlist
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-500'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <FiHeart aria-hidden="true" className={isInWishlist ? 'fill-current' : ''} />
                </button>
              </div>

              {/* View Full Details */}
              <Link
                to={`/products/${product._id}`}
                onClick={onClose}
                className="block text-center text-primary-600 hover:text-primary-700 font-medium"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
