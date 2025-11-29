import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist } from '../../store/slices/wishlistSlice';
import api from '../../utils/api';
import Rating from './Rating';

const RelatedProducts = ({ productId, title = 'Related Products' }) => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(`/products/${productId}/related?limit=8`);
        setProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProducts();
    }
  }, [productId]);

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
  };

  const handleAddToWishlist = (productId) => {
    dispatch(addToWishlist(productId));
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group hover:shadow-md transition"
          >
            {/* Image */}
            <Link to={`/products/${product._id}`} className="block relative">
              <img
                src={product.images?.[0]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-40 object-cover group-hover:scale-105 transition duration-300"
              />
              {/* Quick actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(product);
                  }}
                  className="p-2 bg-white rounded-full text-gray-900 hover:bg-primary-600 hover:text-white transition"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToWishlist(product._id);
                  }}
                  className="p-2 bg-white rounded-full text-gray-900 hover:bg-red-600 hover:text-white transition"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <Link
                  to={`/products/${product._id}`}
                  className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-900 hover:text-white transition"
                >
                  <Eye className="w-5 h-5" />
                </Link>
              </div>
            </Link>

            {/* Info */}
            <div className="p-4">
              <Link
                to={`/products/${product._id}`}
                className="font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2 text-sm"
              >
                {product.name}
              </Link>

              <div className="flex items-center gap-1 mt-2">
                <Rating value={product.rating} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({product.numReviews})
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${product.price.toFixed(2)}
                </span>
                {product.stock > 0 ? (
                  <span className="text-xs text-green-600 dark:text-green-400">In Stock</span>
                ) : (
                  <span className="text-xs text-red-600 dark:text-red-400">Out of Stock</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
