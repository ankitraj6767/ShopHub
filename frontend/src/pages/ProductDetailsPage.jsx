import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiMinus, FiPlus, FiShoppingCart, FiHeart, FiShare2, FiStar, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { fetchProduct, clearProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, selectIsInWishlist } from '../store/slices/wishlistSlice';
import { addToRecentlyViewed } from '../store/slices/recentlyViewedSlice';
import { addToCompare, removeFromCompare } from '../store/slices/compareSlice';
import { formatPrice, formatDate } from '../utils/helpers';
import Rating from '../components/ui/Rating';
import Spinner from '../components/ui/Spinner';
import ProductQuestions from '../components/ui/ProductQuestions';
import StockAlertButton from '../components/ui/StockAlertButton';
import RecentlyViewed from '../components/ui/RecentlyViewed';
import ProductCard from '../components/ui/ProductCard';
import api from '../utils/api';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const productsState = useSelector((state) => state.products) || {};
  const { product = null, isLoading = false, error = null } = productsState;
  const authState = useSelector((state) => state.auth) || {};
  const { isAuthenticated = false } = authState;
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

  useEffect(() => {
    dispatch(fetchProduct(id));
    fetchReviews();
    
    if (isAuthenticated) {
      checkCanReview();
    }

    return () => {
      dispatch(clearProduct());
    };
  }, [dispatch, id, isAuthenticated]);

  // Add to recently viewed when product is loaded
  useEffect(() => {
    if (product && product._id) {
      dispatch(addToRecentlyViewed(product));
    }
  }, [dispatch, product]);

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
    dispatch(addToCart({ product, quantity }));
    toast.success('Added to cart');
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <Link to="/products" className="btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <Rating value={product.rating} />
            <span className="text-gray-500">
              {product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          <p className="text-4xl font-bold text-primary-600 mb-6">
            {formatPrice(product.price)}
          </p>

          <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

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
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition"
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
              <button onClick={handleAddToCart} className="btn-primary flex-1 py-3">
                <FiShoppingCart className="mr-2" />
                Add to Cart
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

          {/* Additional Info */}
          <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
            <p><span className="font-medium">Category:</span> {product.category}</p>
            <p><span className="font-medium">Brand:</span> {product.brand}</p>
            <p><span className="font-medium">SKU:</span> {product._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {isAuthenticated && canReview && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn-primary"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4">Write Your Review</h3>
            
            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`text-2xl ${
                      star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <FiStar className={star <= newReview.rating ? 'fill-current' : ''} />
                  </button>
                ))}
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
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                      {review.isVerifiedPurchase && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified Purchase</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rating value={review.rating} />
                    {review.isRecommended && (
                      <span className="text-xs text-green-600">👍 Recommends</span>
                    )}
                  </div>
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                )}
                
                <p className="text-gray-600 mb-4">{review.comment}</p>
                
                {/* Pros & Cons */}
                {(review.pros?.length > 0 || review.cons?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {review.pros?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Pros</p>
                        <ul className="space-y-1">
                          {review.pros.map((pro, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                              <span className="text-green-500">✓</span> {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Cons</p>
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
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {review.helpfulVotes || 0} people found this helpful
                  </span>
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

      {/* Related Products Section */}
      <RelatedProducts category={product.category} currentProductId={id} />

      {/* Recently Viewed Section */}
      <div className="border-t pt-12 mb-8">
        <RecentlyViewed excludeId={id} />
      </div>
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
    <div className="border-t pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
