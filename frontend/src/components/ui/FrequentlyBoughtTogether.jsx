import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../utils/api';

const FrequentlyBoughtTogether = ({ productId, currentProduct }) => {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentProductData, setCurrentProductData] = useState(currentProduct || null);
  const [currentSelected, setCurrentSelected] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId]);

  // Update currentProductData when currentProduct prop changes
  useEffect(() => {
    if (currentProduct) {
      setCurrentProductData(currentProduct);
    }
  }, [currentProduct]);

  const fetchRelatedProducts = async () => {
    try {
      // Fetch current product if not provided
      let currentProd = currentProduct;
      if (!currentProduct && productId) {
        const productResponse = await api.get(`/products/${productId}`);
        if (productResponse.data.data) {
          currentProd = productResponse.data.data;
          setCurrentProductData(currentProd);
        }
      }

      // First try to get frequently bought together products (based on order history)
      let relatedProducts = [];
      try {
        const frequentlyBoughtResponse = await api.get(`/products/${productId}/frequently-bought?limit=2`);
        if (frequentlyBoughtResponse.data.data && frequentlyBoughtResponse.data.data.length > 0) {
          relatedProducts = frequentlyBoughtResponse.data.data;
        }
      } catch (err) {
        console.log('No frequently bought data, falling back to related products');
      }

      // Fallback to related products (same category) if no frequently bought data
      if (relatedProducts.length === 0 && currentProd?.category) {
        try {
          const relatedResponse = await api.get(`/products/${productId}/related?limit=2`);
          if (relatedResponse.data.data) {
            relatedProducts = relatedResponse.data.data.slice(0, 2);
          }
        } catch (err) {
          console.log('Failed to fetch related products');
        }
      }

      // Final fallback - get products from same category
      if (relatedProducts.length === 0 && currentProd?.category) {
        const categoryResponse = await api.get(`/products?category=${currentProd.category}&limit=3&exclude=${productId}`);
        relatedProducts = (categoryResponse.data.data || []).slice(0, 2);
      }

      setProducts(relatedProducts);
      // Initially select all related products (not the current product by default for better UX)
      const initialSelected = {};
      relatedProducts.forEach(p => {
        initialSelected[p._id] = true;
      });
      setSelected(initialSelected);
    } catch (error) {
      console.error('Failed to fetch related products');
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateTotal = () => {
    // Get current product price safely
    let total = 0;
    
    // Add current product price if selected
    if (currentSelected) {
      const basePrice = Number(currentProductData?.price) || 0;
      total += basePrice;
    }
    
    // Add selected related products
    products.forEach(p => {
      if (selected[p._id]) {
        const itemPrice = Number(p.price) || 0;
        total += itemPrice;
      }
    });
    return total;
  };

  // Count total selected items (current product if selected + selected related products)
  const getSelectedCount = () => {
    const currentCount = currentSelected ? 1 : 0;
    return currentCount + Object.values(selected).filter(Boolean).length;
  };

  // Toggle current product selection
  const toggleCurrentProduct = () => {
    setCurrentSelected(prev => !prev);
  };

  // Handle Add All to Cart
  const handleAddAllToCart = async () => {
    const selectedCount = getSelectedCount();
    if (selectedCount === 0) {
      toast.error('Please select at least one item');
      return;
    }

    setAddingToCart(true);
    
    try {
      const itemsToAdd = [];
      
      // Add current product if selected
      if (currentSelected && currentProductData) {
        itemsToAdd.push(currentProductData);
      }
      
      // Add selected related products
      products.forEach(p => {
        if (selected[p._id]) {
          itemsToAdd.push(p);
        }
      });

      // Add each item to cart
      for (const product of itemsToAdd) {
        dispatch(addToCart({ product, quantity: 1 }));
      }

      toast.success(`${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added to cart!`);
    } catch (error) {
      console.error('Failed to add items to cart:', error);
      toast.error('Failed to add items to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || products.length === 0 || !currentProductData) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Frequently Bought Together</h2>
      
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Current Product - Now Selectable */}
        <div className="text-center">
          <label className="cursor-pointer">
            <input
              type="checkbox"
              checked={currentSelected}
              onChange={toggleCurrentProduct}
              className="sr-only"
            />
            <div className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
              currentSelected ? 'border-primary-500' : 'border-gray-200 dark:border-gray-600 opacity-60'
            }`}>
              <img
                src={currentProductData.images?.[0]?.url || 'https://via.placeholder.com/100'}
                alt={currentProductData.name || 'Current product'}
                className="w-full h-full object-cover"
              />
              {currentSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 block line-clamp-2 max-w-24">
              {currentProductData.name || 'This item'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(currentProductData.price)}</p>
          </label>
        </div>

        {products.map((product, index) => (
          <div key={product._id} className="flex items-center gap-4">
            <span className="text-2xl text-gray-400 dark:text-gray-500">+</span>
            <div className="text-center">
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected[product._id] || false}
                  onChange={() => toggleSelect(product._id)}
                  className="sr-only"
                />
                <div className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 ${
                  selected[product._id] ? 'border-primary-500' : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <img
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {selected[product._id] && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <Link 
                  to={`/products/${product._id}`}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mt-1 block line-clamp-2"
                >
                  {product.name}
                </Link>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total price for {getSelectedCount()} item{getSelectedCount() !== 1 ? 's' : ''}:
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(calculateTotal())}</p>
        </div>
        <button 
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={handleAddAllToCart}
          disabled={addingToCart || getSelectedCount() === 0}
        >
          {addingToCart ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            `Add ${getSelectedCount()} to Cart`
          )}
        </button>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
