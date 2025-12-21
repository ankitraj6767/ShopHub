import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/helpers';
import api from '../../utils/api';

const FrequentlyBoughtTogether = ({ productId, currentPrice }) => {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      const response = await api.get(`/products?limit=3&exclude=${productId}`);
      const relatedProducts = (response.data.data || []).slice(0, 2);
      setProducts(relatedProducts);
      // Initially select all
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
    let total = currentPrice;
    products.forEach(p => {
      if (selected[p._id]) {
        total += p.price;
      }
    });
    return total;
  };

  if (loading || products.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Frequently Bought Together</h2>
      
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Current Product */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-4xl">
            📦
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">This item</p>
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
            Total price for {Object.values(selected).filter(Boolean).length + 1} items:
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatPrice(calculateTotal())}</p>
        </div>
        <button className="btn-primary">Add All to Cart</button>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
