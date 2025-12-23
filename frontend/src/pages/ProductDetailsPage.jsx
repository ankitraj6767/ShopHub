import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMinus, FiPlus, FiShoppingCart, FiHeart, FiShare2, FiStar, FiCheck, FiZap, FiThumbsUp, FiThumbsDown, FiFlag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { fetchProduct, clearProduct } from '../store/slices/productSlice';
import { addToCart, setBuyNowItem } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from '../store/slices/wishlistSlice';
import { addToRecentlyViewed } from '../store/slices/recentlyViewedSlice';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import { trackProductView } from '../store/slices/activitySlice';
import { formatPrice, formatDate } from '../utils/helpers';
import Rating from '../components/ui/Rating';
import Spinner from '../components/ui/Spinner';
import ProductQuestions from '../components/ui/ProductQuestions';
import StockAlertButton from '../components/ui/StockAlertButton';
import PriceAlertButton from '../components/ui/PriceAlertButton';
import RecentlyViewed from '../components/ui/RecentlyViewed';
import ProductCard from '../components/ui/ProductCard';
import FrequentlyBoughtTogether from '../components/ui/FrequentlyBoughtTogether';
import ShareProduct from '../components/ui/ShareProduct';
import CustomersAlsoBought from '../components/ui/CustomersAlsoBought';
import api from '../utils/api';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productsState = useSelector((state) => state.products) || {};
  const { product = null, isLoading = false, error = null } = productsState;
  const authState = useSelector((state) => state.auth) || {};
  const { isAuthenticated = false } = authState;
  const cartItems = useSelector((state) => state.cart?.items || []);
  const isInWishlist = useSelector(selectIsInWishlist(id));
  const compareProducts = useSelector((state) => state.compare?.products || []);
  const isInCompare = compareProducts.some((p) => p._id === id);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', title: '', images: [], pros: [], cons: [], isRecommended: true });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [flashSaleInfo, setFlashSaleInfo] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [reviewVotes, setReviewVotes] = useState({});

  useEffect(() => {
    dispatch(fetchProduct(id));
    fetchReviews();
    checkFlashSale();
    
    if (isAuthenticated) {
      checkCanReview();
    }

    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id, isAuthenticated]);

  // Check if product is in active flash sale
  const checkFlashSale = async () => {
    try {
      const { data } = await api.get('/flash-sales/live');
      if (data.data && data.data.products) {
        const flashProduct = data.data.products.find(p => p.product._id === id || p.product === id);
        if (flashProduct) {
          setFlashSaleInfo({
            salePrice: flashProduct.salePrice,
            originalPrice: flashProduct.originalPrice,
            endTime: data.data.endTime,
            saleName: data.data.name,
            remaining: flashProduct.quantity - flashProduct.sold,
          });
        }
      }
    } catch (error) {
      console.error('Error checking flash sale:', error);
    }
  };

  // Add to recently viewed when product is loaded
  useEffect(() => {
    if (product && product._id) {
      dispatch(addToRecentlyViewed(product));
      // Track product view for personalized recommendations
      if (isAuthenticated) {
        dispatch(trackProductView(product._id));
      }
    }
  }, [dispatch, product, isAuthenticated]);

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/product/${id}`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reviews');
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await api.get(`/reviews/can-review/${id}`);
      setCanReview(response.data.canReview);
    } catch (error) {
      setCanReview(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    // Check flash sale stock if applicable
    if (flashSaleInfo && flashSaleInfo.remaining <= 0) {
      toast.error('Flash sale items are sold out');
      return;
    }
    
    // Check if adding quantity exceeds stock (including items already in cart)
    const existingItem = cartItems.find(item => item._id === product._id);
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;
    const availableStock = flashSaleInfo ? Math.min(product.stock, flashSaleInfo.remaining) : product.stock;
    
    if (totalQuantity > availableStock) {
      const canAdd = availableStock - currentCartQuantity;
      if (canAdd <= 0) {
        toast.error(`You already have the maximum available quantity (${availableStock}) in your cart`);
      } else {
        toast.error(`Only ${canAdd} more available. You have ${currentCartQuantity} in cart.`);
      }
      return;
    }
    
    // Pass flash sale price if available
    dispatch(addToCart({ 
      product, 
      quantity,
      salePrice: flashSaleInfo?.salePrice 
    }));
    
    if (flashSaleInfo) {
      toast.success(`Added to cart at flash sale price: ₹${flashSaleInfo.salePrice.toFixed(2)}!`);
    } else {
      toast.success('Added to cart');
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to buy');
      navigate('/login');
      return;
    }
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    const availableStock = flashSaleInfo ? Math.min(product.stock, flashSaleInfo.remaining) : product.stock;
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items available`);
      return;
    }
    
    // Set as "Buy Now" item and navigate directly to checkout (bypasses cart)
    dispatch(setBuyNowItem({ 
      product, 
      quantity,
      salePrice: flashSaleInfo?.salePrice 
    }));
    navigate('/checkout?buyNow=true');
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(id)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist({ productId: id })).unwrap();
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const addReviewImage = () => {
    if (imageUrl && newReview.images.length < 5) {
      setNewReview({ ...newReview, images: [...newReview.images, imageUrl] });
      setImageUrl('');
    }
  };

  const removeReviewImage = (index) => {
    setNewReview({ ...newReview, images: newReview.images.filter((_, i) => i !== index) });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        productId: id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images,
        pros: newReview.pros.filter(p => p.trim()),
        cons: newReview.cons.filter(c => c.trim()),
        isRecommended: newReview.isRecommended,
      });
      toast.success('Review submitted successfully');
      setNewReview({ rating: 5, comment: '', title: '', images: [], pros: [], cons: [], isRecommended: true });
      setShowReviewForm(false);
      setCanReview(false);
      fetchReviews();
      dispatch(fetchProduct(id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleVoteReview = async (reviewId, helpful) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote on reviews');
      return;
    }
    try {
      const response = await api.post(`/reviews/${reviewId}/vote`, { helpful });
      setReviewVotes({
        ...reviewVotes,
        [reviewId]: { helpful: response.data.data.userVote, count: response.data.data.helpfulVotes }
      });
      // Update the review in the list
      setReviews(reviews.map(r => 
        r._id === reviewId ? { ...r, helpfulVotes: response.data.data.helpfulVotes } : r
      ));
      toast.success(helpful ? 'Marked as helpful' : 'Vote recorded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please login to report reviews');
      return;
    }
    const reason = prompt('Please provide a reason for reporting this review:');
    if (!reason || reason.trim().length < 10) {
      toast.error('Please provide a valid reason (at least 10 characters)');
      return;
    }
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason });
      toast.success('Review reported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report review');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">
          This product may have been removed or is no longer available.
        </p>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
            <img
              src={product.images?.[selectedImage]?.url || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600?text=Product';
              }}
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="mb-4">
            <span className="text-sm text-primary-600 font-medium">{product.brand}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <Rating value={product.rating} />
            <span className="text-gray-500 dark:text-gray-400">
              {product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Flash Sale Banner */}
          {flashSaleInfo && (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <FiZap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{flashSaleInfo.saleName}</p>
                    <p className="text-white/80 text-sm">Limited time offer!</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Only {flashSaleInfo.remaining} left</p>
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {flashSaleInfo ? (
              <div className="flex items-center gap-4">
                <p className="text-4xl font-bold text-red-600">
                  {formatPrice(flashSaleInfo.salePrice)}
                </p>
                <p className="text-2xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </p>
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                  -{Math.round(((product.price - flashSaleInfo.salePrice) / product.price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <p className="text-4xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{product.description}</p>

          {/* Product Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6 space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {variant.name}: <span className="font-normal">{selectedVariants[variant.name] || 'Select'}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedVariants({ ...selectedVariants, [variant.name]: option.value })}
                        disabled={!option.inStock}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedVariants[variant.name] === option.value
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                            : option.inStock
                              ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {variant.name.toLowerCase() === 'color' ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: option.value.toLowerCase() }}
                            />
                            <span>{option.value}</span>
                          </div>
                        ) : (
                          option.value
                        )}
                        {option.priceModifier > 0 && (
                          <span className="text-xs ml-1 text-gray-500">(+₹{option.priceModifier})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <div className="flex items-center text-green-600">
                <FiCheck className="mr-2" />
                <span>{product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}</span>
              </div>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FiMinus />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-gray-100 transition"
                >
                  <FiPlus />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-secondary flex-1 py-3">
                <FiShoppingCart className="mr-2" />
                Add to Cart
              </button>
              <button onClick={handleBuyNow} className="btn-primary flex-1 py-3">
                <FiZap className="mr-2" />
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                className={`p-3 rounded-lg border transition ${
                  isInWishlist
                    ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <FiHeart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}

          {/* Wishlist button for out of stock items */}
          {product.stock === 0 && (
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`w-full py-3 rounded-lg border transition flex items-center justify-center gap-2 ${
                isInWishlist
                  ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FiHeart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          )}

          {/* Stock Alert for out of stock items */}
          {product.stock === 0 && (
            <StockAlertButton productId={product._id} inStock={product.stock > 0} />
          )}

          {/* Compare button */}
          <button
            onClick={() => {
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
            }}
            className={`w-full mt-3 py-2 rounded-lg border transition flex items-center justify-center gap-2 text-sm ${
              isInCompare
                ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isInCompare ? 'Remove from Compare' : 'Add to Compare'}
          </button>

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full mt-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
          >
            <FiShare2 className="w-4 h-4" />
            Share Product
          </button>

          {/* Price Alert Button */}
          {product.stock > 0 && (
            <div className="mt-3">
              <PriceAlertButton 
                productId={product._id} 
                currentPrice={flashSaleInfo?.salePrice || product.price}
                productName={product.name}
              />
            </div>
          )}

          {/* Additional Info */}
          <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
            <p><span className="font-medium">Category:</span> {product.category}</p>
            <p><span className="font-medium">Brand:</span> {product.brand}</p>
            <p><span className="font-medium">SKU:</span> {product._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t dark:border-gray-700 pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
          {isAuthenticated ? (
            canReview ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn-primary"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                ✓ You have already reviewed this product
              </p>
            )
          ) : (
            <Link to="/login" className="btn-secondary text-sm">
              Login to Write a Review
            </Link>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
            <h3 className="font-semibold text-xl mb-6 text-gray-800">Share Your Experience</h3>
            
            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating *</label>
              <div className="flex gap-2 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`text-3xl transition-transform hover:scale-110 ${
                      star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <FiStar className={star <= newReview.rating ? 'fill-current' : ''} />
                  </button>
                ))}
                <span className="ml-3 text-sm font-medium text-gray-600">
                  {newReview.rating === 1 && '😞 Poor'}
                  {newReview.rating === 2 && '😐 Fair'}
                  {newReview.rating === 3 && '🙂 Good'}
                  {newReview.rating === 4 && '😊 Very Good'}
                  {newReview.rating === 5 && '🤩 Excellent'}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="input"
                placeholder="Sum up your review in a headline"
                maxLength={100}
              />
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review *</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                className="input"
                placeholder="Share your experience with this product..."
                required
              />
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pros (What you liked)</label>
                <input
                  type="text"
                  placeholder="Add a pro and press Enter"
                  className="input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      setNewReview({ ...newReview, pros: [...newReview.pros, e.target.value.trim()] });
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newReview.pros.map((pro, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      ✓ {pro}
                      <button type="button" onClick={() => setNewReview({ ...newReview, pros: newReview.pros.filter((_, i) => i !== idx) })} className="hover:text-green-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cons (What could be better)</label>
                <input
                  type="text"
                  placeholder="Add a con and press Enter"
                  className="input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      setNewReview({ ...newReview, cons: [...newReview.cons, e.target.value.trim()] });
                      e.target.value = '';
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {newReview.cons.map((con, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                      ✗ {con}
                      <button type="button" onClick={() => setNewReview({ ...newReview, cons: newReview.cons.filter((_, i) => i !== idx) })} className="hover:text-red-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (up to 5)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input flex-1"
                  placeholder="Enter image URL"
                  disabled={newReview.images.length >= 5}
                />
                <button
                  type="button"
                  onClick={addReviewImage}
                  disabled={!imageUrl || newReview.images.length >= 5}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {newReview.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {newReview.images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <img src={img} alt={`Review ${idx + 1}`} className="w-full h-full object-cover rounded" onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Error'} />
                      <button
                        type="button"
                        onClick={() => removeReviewImage(idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommend */}
            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newReview.isRecommended}
                  onChange={(e) => setNewReview({ ...newReview, isRecommended: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">I would recommend this product</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn-primary">
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">{review.user?.name || 'Anonymous'}</p>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">Verified Purchase</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rating value={review.rating} />
                    {review.isRecommended && (
                      <span className="text-xs text-green-600 dark:text-green-400">👍 Recommends</span>
                    )}
                  </div>
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{review.title}</h4>
                )}
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">{review.comment}</p>
                
                {/* Pros & Cons */}
                {(review.pros?.length > 0 || review.cons?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {review.pros?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Pros</p>
                        <ul className="space-y-1">
                          {review.pros.map((pro, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-1">
                              <span className="text-green-500">✓</span> {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Cons</p>
                        <ul className="space-y-1">
                          {review.cons.map((con, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                              <span className="text-red-500">✗</span> {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Review Images */}
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url || img}
                        alt={`Review image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-90"
                        onClick={() => window.open(img.url || img, '_blank')}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    ))}
                  </div>
                )}
                
                {/* Helpful Votes */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {review.helpfulVotes || 0} people found this helpful
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVoteReview(review._id, true)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${
                          reviewVotes[review._id]?.helpful === true
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <FiThumbsUp className="w-4 h-4" />
                        Helpful
                      </button>
                      <button
                        onClick={() => handleVoteReview(review._id, false)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${
                          reviewVotes[review._id]?.helpful === false
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <FiThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReportReview(review._id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <FiFlag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions & Answers Section */}
      <div className="border-t pt-12">
        <ProductQuestions productId={id} />
      </div>

      {/* Frequently Bought Together */}
      <FrequentlyBoughtTogether productId={id} category={product.category} />

      {/* Customers Also Bought */}
      <CustomersAlsoBought productId={id} />

      {/* Related Products Section */}
      <RelatedProducts category={product.category} currentProductId={id} />

      {/* Recently Viewed Section */}
      <div className="border-t pt-12 mb-8">
        <RecentlyViewed excludeId={id} />
      </div>

      {/* Share Product Modal */}
      <ShareProduct 
        product={product}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};

// Related Products Component
const RelatedProducts = ({ category, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products?category=${encodeURIComponent(category)}&limit=4`);
        const filtered = (response.data.data || []).filter(p => p._id !== currentProductId);
        setProducts(filtered.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch related products');
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchRelated();
    }
  }, [category, currentProductId]);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div className="border-t dark:border-gray-700 pt-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
