import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Check } from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../utils/api';
import Rating from './Rating';

const CustomersAlsoBought = ({ productId }) => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [addedToCart, setAddedToCart] = useState(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get(`/products/${productId}/frequently-bought`);
        setProducts(response.data.data);
        // Pre-select all products
        setSelectedProducts(new Set(response.data.data.map((p) => p._id)));
      } catch (error) {
        console.error('Error fetching frequently bought products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProducts();
    }
  }, [productId]);

  const toggleProduct = (id) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleAddAllToCart = () => {
    const productsToAdd = products.filter((p) => selectedProducts.has(p._id));
    productsToAdd.forEach((product) => {
      dispatch(addToCart({ product, quantity: 1 }));
    });
    setAddedToCart(new Set(productsToAdd.map((p) => p._id)));
    
    // Reset after 2 seconds
    setTimeout(() => setAddedToCart(new Set()), 2000);
  };

  const calculateTotal = () => {
    return products
      .filter((p) => selectedProducts.has(p._id))
      .reduce((sum, p) => sum + p.price, 0);
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Frequently Bought Together
      </h2>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        {products.map((product, index) => (
          <div key={product._id} className="flex items-center gap-4">
            {index > 0 && (
              <span className="text-2xl text-gray-400 font-bold">+</span>
            )}
            <div
              className={`relative cursor-pointer transition ${
                selectedProducts.has(product._id)
                  ? 'ring-2 ring-primary-500'
                  : 'opacity-60'
              } rounded-lg overflow-hidden`}
              onClick={() => toggleProduct(product._id)}
            >
              <img
                src={product.images?.[0]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="w-24 h-24 object-cover"
              />
              {/* Checkbox overlay */}
              <div
                className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedProducts.has(product._id)
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {selectedProducts.has(product._id) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product Details */}
      <div className="space-y-3 mb-6">
        {products.map((product) => (
          <div
            key={product._id}
            className={`flex items-center justify-between p-3 rounded-lg transition ${
              selectedProducts.has(product._id)
                ? 'bg-gray-50 dark:bg-gray-700'
                : 'opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedProducts.has(product._id)}
                onChange={() => toggleProduct(product._id)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <div>
                <Link
                  to={`/products/${product._id}`}
                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <Rating value={product.rating} />
                  <span className="text-xs text-gray-500">({product.numReviews})</span>
                </div>
              </div>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Total and Add to Cart */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total for {selectedProducts.size} items:
          </span>
          <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>
        <button
          onClick={handleAddAllToCart}
          disabled={selectedProducts.size === 0}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {addedToCart.size > 0 ? (
            <>
              <Check className="w-5 h-5" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add All to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CustomersAlsoBought;
